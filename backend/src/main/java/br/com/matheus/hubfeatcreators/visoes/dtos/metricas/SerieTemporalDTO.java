package br.com.matheus.hubfeatcreators.visoes.dtos.metricas;

import java.math.BigDecimal;

/**
 * Ponto de uma série temporal (ex.: faturamento por mês). label = "YYYY-MM".
 */
public record SerieTemporalDTO(String label, BigDecimal valor, long quantidade) {
}
