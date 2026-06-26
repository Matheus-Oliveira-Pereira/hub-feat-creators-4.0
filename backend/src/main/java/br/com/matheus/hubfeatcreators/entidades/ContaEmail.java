package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.configuracoes.AesAttributeConverter;
import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.interfaces.Desativavel;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

@Entity
@Table(name = "CONTA_EMAIL")
@Audited
@Getter
@Setter
@NoArgsConstructor
public class ContaEmail extends Entidade implements Desativavel {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Servidor SMTP é obrigatório")
    private String host;

    private Integer porta;

    @NotBlank(message = "Usuário (e-mail) é obrigatório")
    @Email(message = "Usuário deve ser um e-mail válido")
    private String usuario;

    private String remetenteNome;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Convert(converter = AesAttributeConverter.class)
    @Column(columnDefinition = "TEXT")
    @NotAudited
    private String senha;

    private Boolean tls = true;

    @Column(nullable = false)
    private boolean sistema = false;

    @Enumerated(EnumType.STRING)
    private StatusContaEmail status;

    @Override
    public void desativar() {
        this.status = StatusContaEmail.INATIVO;
    }

    @Override
    public void restaurar() {
        this.status = StatusContaEmail.ATIVO;
    }
}
