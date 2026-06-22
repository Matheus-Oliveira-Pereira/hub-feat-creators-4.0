package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificacaoDTO {
    private String tipo;
    private String entidade;
    private String mensagem;
    private String usuario;
    private LocalDateTime timestamp;

    public NotificacaoDTO(String tipo, String entidade, String mensagem, String usuario) {
        this.tipo = tipo;
        this.entidade = entidade;
        this.mensagem = mensagem;
        this.usuario = usuario;
        this.timestamp = LocalDateTime.now();
    }
}
