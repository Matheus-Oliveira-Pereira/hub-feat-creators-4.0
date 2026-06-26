package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

@Data
public class EmailTesteResponse {
    private final boolean sucesso;
    private final String erro;
}
