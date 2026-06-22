package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class LoginDTO {

    private UUID id;
    private String nome;
    private String email;
    private Set<String> roles;

    public LoginDTO(UUID id, String nome, String email, Set<String> roles) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.roles = roles;
    }
}
