package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusTemplateEmail;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "TEMPLATE_EMAIL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TemplateEmail extends Entidade implements br.com.matheus.hubfeatcreators.interfaces.Desativavel {

    @NotBlank(message = "Nome é obrigatório")
    @Column(unique = true)
    private String nome;

    @NotNull(message = "Tipo é obrigatório")
    @Enumerated(EnumType.STRING)
    private TipoTemplateEmail tipo;

    @NotBlank(message = "Assunto é obrigatório")
    private String assunto;

    @Column(columnDefinition = "TEXT")
    private String corpo;

    private boolean padrao = false;

    @Enumerated(EnumType.STRING)
    private StatusTemplateEmail status;

    @Override
    public void desativar() {
        this.status = StatusTemplateEmail.INATIVO;
    }

    @Override
    public void restaurar() {
        this.status = StatusTemplateEmail.ATIVO;
    }
}
