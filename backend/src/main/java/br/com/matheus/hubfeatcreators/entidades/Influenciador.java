package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusInfluenciador;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "INFLUENCIADOR")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Influenciador extends Entidade implements br.com.matheus.hubfeatcreators.interfaces.Desativavel {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    private String telefone;

    @Column(unique = true)
    private String instagram;

    @Column(unique = true)
    private String tiktok;

    @Column(unique = true)
    private String linkedin;

    @Column(unique = true)
    private String youtube;

    @Column(unique = true)
    private String discord;

    private String nicho;

    private String subnicho;

    @Column(columnDefinition = "TEXT")
    private String foto;

    @Enumerated(EnumType.STRING)
    private StatusInfluenciador status;

    @Override
    public void desativar() {
        this.status = StatusInfluenciador.INATIVO;
    }

    @Override
    public void restaurar() {
        this.status = StatusInfluenciador.ATIVO;
    }
}
