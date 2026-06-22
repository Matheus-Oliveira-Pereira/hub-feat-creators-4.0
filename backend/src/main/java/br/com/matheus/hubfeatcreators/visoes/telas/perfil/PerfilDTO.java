package br.com.matheus.hubfeatcreators.visoes.telas.perfil;

import br.com.matheus.hubfeatcreators.enums.StatusPerfil;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class PerfilDTO {

    private UUID id;
    private String descricao;
    private StatusPerfil status;
    private List<String> roles = new ArrayList<>();
    private Integer totalA = 0;
    private Integer totalB = 0;
    private Integer totalC = 0;
    private Integer totalD = 0;

    public PerfilDTO(UUID id, String descricao, StatusPerfil status) {
        this.id = id;
        this.descricao = descricao;
        this.status = status;
    }
}
