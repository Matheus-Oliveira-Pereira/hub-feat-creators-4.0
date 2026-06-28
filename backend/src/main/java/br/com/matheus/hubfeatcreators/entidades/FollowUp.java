package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "FOLLOW_UP")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FollowUp extends Entidade {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prospecao_id")
    @JsonIgnore
    private Prospecao prospecao;

    private LocalDateTime data;

    /** Etapa da prospecção no momento do follow-up. */
    @Enumerated(EnumType.STRING)
    private StatusProspecao statusProspecao;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_email_id")
    private LogEmail logEmail;
}
