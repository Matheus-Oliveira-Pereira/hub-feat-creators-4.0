package br.com.matheus.hubfeatcreators.visoes.dtos;

import lombok.Data;

import java.util.List;

@Data
public class EnvioEmailRequest {
    private String assunto;
    private String corpo;
    private String observacoes;
    /** Destinatários em cópia (CC), opcional. */
    private List<String> cc;
    /** Destinatários em cópia oculta (BCC), opcional — somados aos fixos da conta. */
    private List<String> cco;
}
