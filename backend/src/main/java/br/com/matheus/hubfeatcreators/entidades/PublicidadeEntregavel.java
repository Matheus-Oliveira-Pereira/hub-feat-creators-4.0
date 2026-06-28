package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusEntregavel;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDate;

@Entity
@Table(name = "PUBLICIDADE_ENTREGAVEL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicidadeEntregavel extends Entidade {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publicidade_id")
    @JsonIgnore
    private Publicidade publicidade;

    @Enumerated(EnumType.STRING)
    private StatusEntregavel status;

    @Column(columnDefinition = "TEXT")
    private String escopo;

    private LocalDate dataEntrega;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "formato_id")
    private PublicidadeEntregaveisFormato formato;
}
