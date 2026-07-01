package br.com.matheus.hubfeatcreators.visoes.dtos.metricas;

import java.math.BigDecimal;

/**
 * KPIs agregados (financeiro + pipeline) exibidos nos cards da tela de Métricas.
 */
public record MetricasResumoDTO(
        // Financeiro
        BigDecimal faturamentoTotal,
        BigDecimal receitaAssessora,
        BigDecimal repasseInfluenciador,
        BigDecimal valorRecebido,
        BigDecimal valorPendente,
        BigDecimal valorAtrasado,
        long countRecebido,
        long countPendente,
        long countAtrasado,
        long totalNotas,
        BigDecimal ticketMedio,
        long totalDeals,
        // Pipeline
        long totalProspecoes,
        long prospecoesFechadas,
        long prospecoesEncerradas,
        long prospecoesEmAndamento,
        double taxaConversao,
        BigDecimal valorEmNegociacao,
        BigDecimal valorFechado
) {
}
