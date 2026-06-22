package br.com.matheus.hubfeatcreators.visoes.telas.influenciador;

import br.com.matheus.hubfeatcreators.enums.StatusInfluenciador;
import lombok.Data;

import java.util.UUID;

@Data
public class InfluenciadorDTO {

    private UUID id;
    private String nome;
    private String email;
    private String telefone;
    private String instagram;
    private StatusInfluenciador status;

    public InfluenciadorDTO(UUID id, String nome, String email, String telefone, String instagram, StatusInfluenciador status) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.instagram = instagram;
        this.status = status;
    }
}
