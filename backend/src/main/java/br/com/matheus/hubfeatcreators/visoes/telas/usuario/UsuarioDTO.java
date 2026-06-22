package br.com.matheus.hubfeatcreators.visoes.telas.usuario;

import br.com.matheus.hubfeatcreators.enums.StatusUsuario;
import lombok.Data;

import java.util.UUID;

@Data
public class UsuarioDTO {

    private UUID id;
    private String nome;
    private String email;
    private StatusUsuario status;
    private String perfis;

    public UsuarioDTO(UUID id, String nome, String email, StatusUsuario status) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.status = status;
    }
}
