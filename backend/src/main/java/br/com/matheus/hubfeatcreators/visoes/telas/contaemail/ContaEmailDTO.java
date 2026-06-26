package br.com.matheus.hubfeatcreators.visoes.telas.contaemail;

import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import lombok.Data;

import java.util.UUID;

@Data
public class ContaEmailDTO {

    private UUID id;
    private String nome;
    private String usuario;
    private String host;
    private Integer porta;
    private boolean sistema;
    private StatusContaEmail status;

    public ContaEmailDTO(UUID id, String nome, String usuario, String host, Integer porta,
                         boolean sistema, StatusContaEmail status) {
        this.id = id;
        this.nome = nome;
        this.usuario = usuario;
        this.host = host;
        this.porta = porta;
        this.sistema = sistema;
        this.status = status;
    }
}
