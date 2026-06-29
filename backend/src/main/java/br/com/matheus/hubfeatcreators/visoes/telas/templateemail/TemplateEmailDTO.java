package br.com.matheus.hubfeatcreators.visoes.telas.templateemail;

import br.com.matheus.hubfeatcreators.enums.StatusTemplateEmail;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;
import lombok.Data;

import java.util.UUID;

@Data
public class TemplateEmailDTO {

    private UUID id;
    private String nome;
    private TipoTemplateEmail tipo;
    private String assunto;
    private boolean padrao;
    private StatusTemplateEmail status;

    public TemplateEmailDTO(UUID id, String nome, TipoTemplateEmail tipo, String assunto,
                            boolean padrao, StatusTemplateEmail status) {
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.assunto = assunto;
        this.padrao = padrao;
        this.status = status;
    }
}
