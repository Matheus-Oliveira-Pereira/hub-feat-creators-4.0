package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImportacaoLinhaDTO {

    private int linha;
    private String nome;
    private String status;
    private String erro;

    public static ImportacaoLinhaDTO sucesso(int linha, String nome) {
        return new ImportacaoLinhaDTO(linha, nome, "SUCESSO", null);
    }

    public static ImportacaoLinhaDTO duplicado(int linha, String nome) {
        return new ImportacaoLinhaDTO(linha, nome, "DUPLICADO", "Registro já existe");
    }

    public static ImportacaoLinhaDTO erro(int linha, String nome, String erro) {
        return new ImportacaoLinhaDTO(linha, nome, "ERRO", erro);
    }
}
