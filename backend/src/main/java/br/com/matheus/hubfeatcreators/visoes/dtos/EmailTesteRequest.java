package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

import java.util.UUID;

@Data
public class EmailTesteRequest {
    private String destino;
    private UUID contaId;
}
