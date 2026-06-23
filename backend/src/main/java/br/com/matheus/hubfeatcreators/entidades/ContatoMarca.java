package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Entity
@Table(name = "CONTATO_MARCA")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContatoMarca extends Entidade {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marca_id")
    @JsonIgnore
    private Marca marca;

    private String nome;

    private String email;

    private String telefone;

    private Integer ordem;
}
