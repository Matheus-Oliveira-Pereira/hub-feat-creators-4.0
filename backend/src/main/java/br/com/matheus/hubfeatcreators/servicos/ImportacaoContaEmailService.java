package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.visoes.dtos.ImportacaoLinhaDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.ImportacaoResultadoDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportacaoContaEmailService {

    private static final String[] COLUNAS_ESPERADAS = {
            "nome", "host", "porta", "usuario", "senha", "remetentenome", "tls", "sistema"
    };

    private final ContaEmailService contaEmailService;

    public ImportacaoResultadoDTO importar(MultipartFile arquivo) {
        var resultado = new ImportacaoResultadoDTO();

        try (var reader = new BufferedReader(new InputStreamReader(arquivo.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                resultado.addDetalhe(ImportacaoLinhaDTO.erro(1, "", "Arquivo vazio"));
                return resultado;
            }

            // Remove BOM se presente
            if (headerLine.startsWith("﻿")) {
                headerLine = headerLine.substring(1);
            }

            String separador = detectarSeparador(headerLine);
            String[] headers = parseLinha(headerLine, separador);
            int[] indices = mapearColunas(headers);

            if (indices[0] == -1 || indices[1] == -1 || indices[3] == -1) {
                resultado.addDetalhe(ImportacaoLinhaDTO.erro(1, "", "Colunas obrigatórias 'nome', 'host' e 'usuario' não encontradas no cabeçalho"));
                return resultado;
            }

            String linha;
            int numLinha = 1;
            while ((linha = reader.readLine()) != null) {
                numLinha++;
                if (linha.isBlank()) continue;

                String[] campos = parseLinha(linha, separador);
                processarLinha(resultado, numLinha, campos, indices);
            }

        } catch (Exception e) {
            log.error("Erro ao processar arquivo CSV", e);
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(0, "", "Erro ao ler arquivo: " + e.getMessage()));
        }

        return resultado;
    }

    private String detectarSeparador(String headerLine) {
        long virgulas = headerLine.chars().filter(c -> c == ',').count();
        long pontoVirgulas = headerLine.chars().filter(c -> c == ';').count();
        return pontoVirgulas > virgulas ? ";" : ",";
    }

    private String[] parseLinha(String linha, String separador) {
        return linha.split(separador, -1);
    }

    private int[] mapearColunas(String[] headers) {
        int[] indices = new int[COLUNAS_ESPERADAS.length];
        for (int i = 0; i < indices.length; i++) indices[i] = -1;

        for (int h = 0; h < headers.length; h++) {
            String header = headers[h].trim().toLowerCase().replaceAll("[\"']", "");
            for (int c = 0; c < COLUNAS_ESPERADAS.length; c++) {
                if (COLUNAS_ESPERADAS[c].equals(header)) {
                    indices[c] = h;
                    break;
                }
            }
        }
        return indices;
    }

    private String campo(String[] campos, int indice) {
        if (indice < 0 || indice >= campos.length) return null;
        String valor = campos[indice].trim().replaceAll("^\"|\"$", "");
        return valor.isEmpty() ? null : valor;
    }

    private Integer inteiro(String valor) {
        if (valor == null) return null;
        try {
            return Integer.valueOf(valor.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean booleano(String valor, boolean padrao) {
        if (valor == null) return padrao;
        String v = valor.trim().toLowerCase();
        return v.equals("true") || v.equals("sim") || v.equals("1") || v.equals("s");
    }

    private void processarLinha(ImportacaoResultadoDTO resultado, int numLinha, String[] campos, int[] indices) {
        String nome = campo(campos, indices[0]);
        String host = campo(campos, indices[1]);
        String usuario = campo(campos, indices[3]);

        if (nome == null || nome.isBlank()) {
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, "", "Nome é obrigatório"));
            return;
        }
        if (host == null || host.isBlank()) {
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, nome, "Servidor SMTP (host) é obrigatório"));
            return;
        }
        if (usuario == null || usuario.isBlank()) {
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, nome, "Usuário (e-mail) é obrigatório"));
            return;
        }

        try {
            var conta = new ContaEmail();
            conta.setNome(nome);
            conta.setHost(host);
            conta.setPorta(inteiro(campo(campos, indices[2])));
            conta.setUsuario(usuario);
            conta.setSenha(campo(campos, indices[4]));
            conta.setRemetenteNome(campo(campos, indices[5]));
            conta.setTls(booleano(campo(campos, indices[6]), true));
            conta.setSistema(booleano(campo(campos, indices[7]), false));
            conta.setStatus(StatusContaEmail.ATIVO);

            contaEmailService.salvar(conta);
            resultado.addDetalhe(ImportacaoLinhaDTO.sucesso(numLinha, nome));

        } catch (DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            if (msg != null && (msg.toLowerCase().contains("unique") || msg.toLowerCase().contains("duplicate") || msg.toLowerCase().contains("duplicar"))) {
                resultado.addDetalhe(ImportacaoLinhaDTO.duplicado(numLinha, nome));
            } else {
                resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, nome, "Violação de integridade: " + msg));
            }
        } catch (Exception e) {
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, nome, e.getMessage()));
        }
    }

    public String gerarTemplate() {
        return String.join(";", COLUNAS_ESPERADAS) + "\n"
                + "Conta principal;smtp.gmail.com;587;contato@empresa.com;senha-ou-app-password;Hub Feat Creators;true;true\n"
                + "Conta secundária;smtp.gmail.com;587;vendas@empresa.com;senha123;Vendas;true;false\n";
    }
}
