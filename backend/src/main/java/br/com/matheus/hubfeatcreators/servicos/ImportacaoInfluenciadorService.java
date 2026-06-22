package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.enums.StatusInfluenciador;
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
public class ImportacaoInfluenciadorService {

    private static final String[] COLUNAS_ESPERADAS = {
            "nome", "email", "telefone", "instagram", "tiktok", "linkedin", "youtube", "foto"
    };

    private final InfluenciadorService influenciadorService;

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

            if (indices[0] == -1 || indices[1] == -1) {
                resultado.addDetalhe(ImportacaoLinhaDTO.erro(1, "", "Colunas obrigatórias 'nome' e 'email' não encontradas no cabeçalho"));
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

    private void processarLinha(ImportacaoResultadoDTO resultado, int numLinha, String[] campos, int[] indices) {
        String nome = campo(campos, indices[0]);
        String email = campo(campos, indices[1]);

        if (nome == null || nome.isBlank()) {
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, "", "Nome é obrigatório"));
            return;
        }
        if (email == null || email.isBlank()) {
            resultado.addDetalhe(ImportacaoLinhaDTO.erro(numLinha, nome, "E-mail é obrigatório"));
            return;
        }

        try {
            var influenciador = new Influenciador();
            influenciador.setNome(nome);
            influenciador.setEmail(email);
            influenciador.setTelefone(campo(campos, indices[2]));
            influenciador.setInstagram(campo(campos, indices[3]));
            influenciador.setTiktok(campo(campos, indices[4]));
            influenciador.setLinkedin(campo(campos, indices[5]));
            influenciador.setYoutube(campo(campos, indices[6]));
            influenciador.setFoto(campo(campos, indices[7]));
            influenciador.setStatus(StatusInfluenciador.ATIVO);

            influenciadorService.salvar(influenciador);
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
                + "João Silva;joao@email.com;11999998888;@joaosilva;@joaotiktok;joao-silva;JoaoCanal;https://foto.jpg\n"
                + "Maria Santos;maria@email.com;11888887777;@mariasantos;;;;\n";
    }
}
