package br.com.matheus.hubfeatcreators.configuracoes;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Criptografa atributos sensíveis (ex: chave da API do Claude) em repouso.
 * AES/GCM com chave derivada de CONFIG_ENCRYPTION_KEY (env). Fallback só para desenvolvimento.
 */
@Converter
public class AesAttributeConverter implements AttributeConverter<String, String> {

    private static final String ALGORITMO = "AES/GCM/NoPadding";
    private static final int IV_TAMANHO = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec chave;
    private final SecureRandom random = new SecureRandom();

    public AesAttributeConverter() {
        String segredo = System.getenv("CONFIG_ENCRYPTION_KEY");
        if (segredo == null || segredo.isBlank()) {
            segredo = "hub-feat-creators-dev-encryption-key-altere-em-producao";
        }
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(segredo.getBytes(StandardCharsets.UTF_8));
            this.chave = new SecretKeySpec(hash, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao inicializar criptografia", e);
        }
    }

    @Override
    public String convertToDatabaseColumn(String valor) {
        if (valor == null || valor.isBlank()) {
            return valor;
        }
        try {
            byte[] iv = new byte[IV_TAMANHO];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.ENCRYPT_MODE, chave, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cifrado = cipher.doFinal(valor.getBytes(StandardCharsets.UTF_8));
            byte[] combinado = new byte[iv.length + cifrado.length];
            System.arraycopy(iv, 0, combinado, 0, iv.length);
            System.arraycopy(cifrado, 0, combinado, iv.length, cifrado.length);
            return Base64.getEncoder().encodeToString(combinado);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao criptografar valor", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String valorBanco) {
        if (valorBanco == null || valorBanco.isBlank()) {
            return valorBanco;
        }
        try {
            byte[] combinado = Base64.getDecoder().decode(valorBanco);
            byte[] iv = new byte[IV_TAMANHO];
            System.arraycopy(combinado, 0, iv, 0, IV_TAMANHO);
            byte[] cifrado = new byte[combinado.length - IV_TAMANHO];
            System.arraycopy(combinado, IV_TAMANHO, cifrado, 0, cifrado.length);
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.DECRYPT_MODE, chave, new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(cifrado), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Valor legado/corrompido — retorna como está para não quebrar boot
            return valorBanco;
        }
    }
}
