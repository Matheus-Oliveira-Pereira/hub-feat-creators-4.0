package br.com.matheus.hubfeatcreators.visoes.telas.midiakit;

import br.com.matheus.hubfeatcreators.enums.StatusMidiaKitTemplate;
import lombok.Data;

import java.util.UUID;

@Data
public class MidiaKitTemplateDTO {

    private UUID id;
    private String nome;
    private String influenciadorNome;
    private StatusMidiaKitTemplate status;
    private Long qtdSessoes = 0L;

    public MidiaKitTemplateDTO(UUID id, String nome, String influenciadorNome, StatusMidiaKitTemplate status) {
        this.id = id;
        this.nome = nome;
        this.influenciadorNome = influenciadorNome;
        this.status = status;
    }
}
