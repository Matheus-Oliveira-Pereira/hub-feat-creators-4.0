package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Tarefa;
import br.com.matheus.hubfeatcreators.enums.StatusTarefa;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface TarefaRepository extends EntidadeRepository<Tarefa> {

    /** Candidatas a lembrete: automáticas, ativas, não finalizadas, com previsão dentro da janela de disparo. */
    List<Tarefa> findByNotificacaoAutomaticaTrueAndAtivoTrueAndStatusNotInAndPrevisaoTerminoBetween(
            Collection<StatusTarefa> statusExcluidos, LocalDate de, LocalDate ate);
}
