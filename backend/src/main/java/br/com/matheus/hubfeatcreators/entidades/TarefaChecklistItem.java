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
@Table(name = "TAREFA_CHECKLIST_ITEM")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TarefaChecklistItem extends Entidade {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarefa_id")
    @JsonIgnore
    private Tarefa tarefa;

    private String descricao;

    private boolean concluido;

    private Integer ordem;
}
