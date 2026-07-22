package br.com.matheus.hubfeatcreators.visoes.telas.email;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LogEmailDTO {

    private UUID id;
    private String titulo;
    private String destinatarios;
    private String copia;
    private String copiaOculta;
    private String conta;
    private LogEmail.Status status;
    private String erro;
    private LocalDateTime registro;
    private String criadoPor;
    private boolean aberto;
    private LocalDateTime dataAbertura;
    private int tentativas;

    public LogEmailDTO(UUID id, String titulo, String destinatarios, String copia, String copiaOculta,
                       String conta, LogEmail.Status status, String erro, LocalDateTime registro, String criadoPor,
                       boolean aberto, LocalDateTime dataAbertura, int tentativas) {
        this.id = id;
        this.titulo = titulo;
        this.destinatarios = destinatarios;
        this.copia = copia;
        this.copiaOculta = copiaOculta;
        this.conta = conta;
        this.status = status;
        this.erro = erro;
        this.registro = registro;
        this.criadoPor = criadoPor;
        this.aberto = aberto;
        this.dataAbertura = dataAbertura;
        this.tentativas = tentativas;
    }
}
