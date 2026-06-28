package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregavel;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeFinanceiro;
import br.com.matheus.hubfeatcreators.enums.StatusEntregavel;
import br.com.matheus.hubfeatcreators.enums.StatusFinanceiro;
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
 * - financeiros com recebimento previsto vencido e não recebidos → PAGAMENTO_ATRASADO
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AtualizacaoStatusJob {

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

        List<PublicidadeFinanceiro> financeiros = financeiroRepository
                .findByDataPrevistaRecebimentoBeforeAndStatusNotIn(hoje,
                        List.of(StatusFinanceiro.PAGAMENTO_RECEBIDO, StatusFinanceiro.PAGAMENTO_ATRASADO));
        financeiros.forEach(f -> f.setStatus(StatusFinanceiro.PAGAMENTO_ATRASADO));
        financeiroRepository.saveAll(financeiros);

        if (!entregaveis.isEmpty() || !financeiros.isEmpty()) {
            log.info("Job de atrasos: {} entregáveis e {} financeiros marcados como atrasados.",
                    entregaveis.size(), financeiros.size());
        }
    }
}
