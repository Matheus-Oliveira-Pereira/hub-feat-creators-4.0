package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.TipoLembreteTarefa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Log operacional de lembretes enviados — garante idempotência do job diário.
 * Chave lógica: (tarefa, tipo, dataReferencia = previsão de término usada no cálculo).
 * Se a previsão de término muda, os lembretes re-armam para a nova data.
 */
@Entity
@Table(name = "TAREFA_LEMBRETE_ENVIADO",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tarefa_id", "tipo", "data_referencia"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TarefaLembreteEnviado extends Entidade {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarefa_id")
    private Tarefa tarefa;

    @Enumerated(EnumType.STRING)
    private TipoLembreteTarefa tipo;

    @Column(name = "data_referencia")
    private LocalDate dataReferencia;

    private LocalDateTime dataEnvio;
}
