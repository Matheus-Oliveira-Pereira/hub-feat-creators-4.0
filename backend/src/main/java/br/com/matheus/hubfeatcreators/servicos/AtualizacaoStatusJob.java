package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregavel;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeFinanceiro;
import br.com.matheus.hubfeatcreators.enums.StatusEntregavel;
import br.com.matheus.hubfeatcreators.enums.StatusPagamento;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeEntregavelRepository;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeFinanceiroRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Atualiza diariamente os status de atraso:
 * - entregáveis com data de entrega vencida e ainda não publicados → ATRASADO
 * - financeiros não pagos com vencimento da nota (ou recebimento previsto) vencido → pagamento ATRASADO
 * - alerta (log) de notas não emitidas há mais de {@link #DIAS_ALERTA_NOTA} dias do fechamento
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AtualizacaoStatusJob {

    private static final int DIAS_ALERTA_NOTA = 7;

    private final PublicidadeEntregavelRepository entregavelRepository;
    private final PublicidadeFinanceiroRepository financeiroRepository;

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void atualizarAtrasos() {
        LocalDate hoje = LocalDate.now();

        List<PublicidadeEntregavel> entregaveis = entregavelRepository
                .findByDataEntregaBeforeAndStatusNotIn(hoje, List.of(StatusEntregavel.PUBLICADO, StatusEntregavel.ATRASADO));
        entregaveis.forEach(e -> e.setStatus(StatusEntregavel.ATRASADO));
        entregavelRepository.saveAll(entregaveis);

        // Pagamento atrasado: base = vencimento da nota (preferencial) ou recebimento previsto.
        List<PublicidadeFinanceiro> naoPagos = financeiroRepository
                .findByStatusPagamentoNotIn(List.of(StatusPagamento.RECEBIDO, StatusPagamento.ATRASADO));
        List<PublicidadeFinanceiro> atrasados = naoPagos.stream()
                .filter(f -> {
                    LocalDate base = f.getDataVencimentoNota() != null ? f.getDataVencimentoNota() : f.getDataPrevistaRecebimento();
                    return base != null && base.isBefore(hoje);
                })
                .toList();
        atrasados.forEach(f -> f.setStatusPagamento(StatusPagamento.ATRASADO));
        financeiroRepository.saveAll(atrasados);

        // Alerta: notas não emitidas há mais de N dias do fechamento.
        int notasPendentes = financeiroRepository
                .notaNaoEmitidaAntesDe(hoje.minusDays(DIAS_ALERTA_NOTA).atStartOfDay()).size();
        if (notasPendentes > 0) {
            log.warn("Alerta: {} publicidade(s) com nota não emitida há mais de {} dias do fechamento.",
                    notasPendentes, DIAS_ALERTA_NOTA);
        }

        if (!entregaveis.isEmpty() || !atrasados.isEmpty()) {
            log.info("Job de atrasos: {} entregáveis e {} financeiros marcados como atrasados.",
                    entregaveis.size(), atrasados.size());
        }
    }
}
