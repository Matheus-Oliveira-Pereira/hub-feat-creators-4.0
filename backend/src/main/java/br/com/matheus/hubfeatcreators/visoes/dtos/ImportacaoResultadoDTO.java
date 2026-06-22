package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ImportacaoResultadoDTO {

    private int totalLinhas;
    private int sucesso;
    private int duplicados;
    private int erros;
    private List<ImportacaoLinhaDTO> detalhes = new ArrayList<>();

    public void addDetalhe(ImportacaoLinhaDTO detalhe) {
        detalhes.add(detalhe);
        switch (detalhe.getStatus()) {
            case "SUCESSO" -> sucesso++;
            case "DUPLICADO" -> duplicados++;
            case "ERRO" -> erros++;
        }
        totalLinhas++;
    }
}
