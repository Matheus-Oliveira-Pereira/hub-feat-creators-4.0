package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Tarefa;
import br.com.matheus.hubfeatcreators.entidades.TarefaLembreteEnviado;
import br.com.matheus.hubfeatcreators.enums.StatusTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoLembreteTarefa;
import br.com.matheus.hubfeatcreators.repositorios.TarefaLembreteEnviadoRepository;
import br.com.matheus.hubfeatcreators.repositorios.TarefaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Envia diariamente os lembretes de tarefas com notificação automática.
 * Match por data exata (sem catch-up): tarefa criada hoje com previsão semana que vem
 * não recebe o "1 semana antes" retroativo. Idempotência via {@link TarefaLembreteEnviado}:
 * o marcador é salvo mesmo em falha SMTP — o reenvio é responsabilidade do EmailRetryJob
 * (LogEmail FALHA), reenviar aqui duplicaria após o retry.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TarefaLembreteJob {

    private final TarefaRepository tarefaRepository;
    private final TarefaLembreteEnviadoRepository enviadoRepository;
    private final TarefaService tarefaService;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void enviarLembretes() {
        LocalDate hoje = LocalDate.now();
        List<Tarefa> candidatas = tarefaRepository
                .findByNotificacaoAutomaticaTrueAndAtivoTrueAndStatusNotInAndPrevisaoTerminoBetween(
                        List.of(StatusTarefa.CONCLUIDA, StatusTarefa.CANCELADA),
                        hoje.minusDays(1), hoje.plusDays(7));

        int enviados = 0;
        for (Tarefa tarefa : candidatas) {
            for (TipoLembreteTarefa tipo : tarefa.getLembretes()) {
                if (!tipo.dataDisparo(tarefa.getPrevisaoTermino()).equals(hoje)) {
                    continue;
                }
                if (enviadoRepository.existsByTarefaIdAndTipoAndDataReferencia(
                        tarefa.getId(), tipo, tarefa.getPrevisaoTermino())) {
                    continue;
                }
                try {
                    emailService.enviarSync(
                            tarefaService.construirEmailLembrete(tarefa, tipo),
                            tarefaService.influenciadorParaConta(tarefa));
                    enviados++;
                } catch (Exception e) {
                    log.error("Falha ao enviar lembrete {} da tarefa {}: {}", tipo, tarefa.getId(), e.getMessage());
                }
                enviadoRepository.save(new TarefaLembreteEnviado(
                        tarefa, tipo, tarefa.getPrevisaoTermino(), LocalDateTime.now()));
            }
        }
        if (enviados > 0) {
            log.info("Job de lembretes de tarefas: {} lembrete(s) enviado(s).", enviados);
        }
    }
}
