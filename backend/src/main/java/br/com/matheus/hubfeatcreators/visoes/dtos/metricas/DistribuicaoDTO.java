package br.com.matheus.hubfeatcreators.visoes.dtos.metricas;

import java.math.BigDecimal;

/**
 * Categoria de uma distribuição (funil de status, status de pagamento, formatos de entregável...).
 */
public record DistribuicaoDTO(String categoria, BigDecimal valor, long quantidade) {
}
