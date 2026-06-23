package br.com.matheus.hubfeatcreators.visoes.telas.marca;

import br.com.matheus.hubfeatcreators.enums.StatusMarca;
import lombok.Data;

import java.util.UUID;

@Data
public class MarcaDTO {

    private UUID id;
    private String nome;
    private StatusMarca status;
    private Long qtdContatos = 0L;

    public MarcaDTO(UUID id, String nome, StatusMarca status) {
        this.id = id;
        this.nome = nome;
        this.status = status;
    }
}
