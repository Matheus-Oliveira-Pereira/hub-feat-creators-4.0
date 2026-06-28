package br.com.matheus.hubfeatcreators.visoes.telas.publicidade;

import br.com.matheus.hubfeatcreators.enums.StatusFinanceiro;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PublicidadeDTO {

    private UUID id;
    private String marcaNome;
    private String influenciadorNome;
    private String parceiro;
    private StatusFinanceiro statusFinanceiro;
    private BigDecimal valorTotal;
    private boolean ativo;
    private Long qtdEntregaveis = 0L;

    public PublicidadeDTO(UUID id, String marcaNome, String influenciadorNome, String parceiro,
                          StatusFinanceiro statusFinanceiro, BigDecimal valorTotal, boolean ativo) {
        this.id = id;
        this.marcaNome = marcaNome;
        this.influenciadorNome = influenciadorNome;
        this.parceiro = parceiro;
        this.statusFinanceiro = statusFinanceiro;
        this.valorTotal = valorTotal;
        this.ativo = ativo;
    }
}
