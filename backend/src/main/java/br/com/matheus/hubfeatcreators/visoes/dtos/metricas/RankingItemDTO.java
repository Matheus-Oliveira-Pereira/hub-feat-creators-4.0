package br.com.matheus.hubfeatcreators.visoes.dtos.metricas;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Item de ranking (influenciador ou marca) ordenado por valor.
 */
public record RankingItemDTO(UUID id, String nome, BigDecimal valor, long quantidade) {
}
