package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

import java.util.UUID;

@Data
public class CopiarTemplateRequest {
    private UUID novoInfluenciadorId;
}
