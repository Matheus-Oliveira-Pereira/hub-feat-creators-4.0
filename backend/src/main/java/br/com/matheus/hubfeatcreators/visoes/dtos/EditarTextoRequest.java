package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

@Data
public class EditarTextoRequest {
    private String texto;
    private String comando;
}
