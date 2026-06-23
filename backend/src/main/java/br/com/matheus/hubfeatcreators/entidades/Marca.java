package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusMarca;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "MARCA")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Marca extends Entidade implements br.com.matheus.hubfeatcreators.interfaces.Desativavel {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @Enumerated(EnumType.STRING)
    private StatusMarca status;

    @OneToMany(mappedBy = "marca", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordem ASC")
    @NotAudited
    private List<ContatoMarca> contatos = new ArrayList<>();

    @Override
    public void desativar() {
        this.status = StatusMarca.INATIVO;
    }

    @Override
    public void restaurar() {
        this.status = StatusMarca.ATIVO;
    }
}
