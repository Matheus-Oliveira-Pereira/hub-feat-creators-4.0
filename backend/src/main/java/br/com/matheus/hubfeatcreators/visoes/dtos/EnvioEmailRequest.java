package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

@Data
public class EnvioEmailRequest {
    private String assunto;
    private String corpo;
    private String observacoes;
}
