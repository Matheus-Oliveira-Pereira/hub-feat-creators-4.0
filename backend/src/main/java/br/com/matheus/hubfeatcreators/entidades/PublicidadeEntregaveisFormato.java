package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

/** Formatos de entregável pré-cadastrados (reels, stories, post, etc). Lista de referência. */
@Entity
@Table(name = "PUBLICIDADE_ENTREGAVEIS_FORMATO")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicidadeEntregaveisFormato extends Entidade {

    @NotBlank(message = "Descrição é obrigatória")
    @Column(unique = true)
    private String descricao;
}
