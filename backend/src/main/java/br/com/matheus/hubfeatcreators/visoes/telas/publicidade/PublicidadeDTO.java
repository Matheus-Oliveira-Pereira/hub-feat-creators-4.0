package br.com.matheus.hubfeatcreators.visoes.telas.publicidade;

import br.com.matheus.hubfeatcreators.enums.Moeda;
import br.com.matheus.hubfeatcreators.enums.StatusNota;
import br.com.matheus.hubfeatcreators.enums.StatusPagamento;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PublicidadeDTO {

    private UUID id;
    private String marcaNome;
    private String influenciadorNome;
    private String parceiro;
    private StatusNota statusNota;
    private StatusPagamento statusPagamento;
    private Moeda moeda;
    private BigDecimal valorTotal;
    private LocalDate dataPrevistaRecebimento;
    private LocalDateTime registro;
    private boolean ativo;
    private Long qtdEntregaveis = 0L;

    public PublicidadeDTO(UUID id, String marcaNome, String influenciadorNome, String parceiro,
                          StatusNota statusNota, StatusPagamento statusPagamento, Moeda moeda,
                          BigDecimal valorTotal, LocalDate dataPrevistaRecebimento, LocalDateTime registro, boolean ativo) {
        this.id = id;
        this.marcaNome = marcaNome;
        this.influenciadorNome = influenciadorNome;
        this.parceiro = parceiro;
        this.statusNota = statusNota;
        this.statusPagamento = statusPagamento;
        this.moeda = moeda;
        this.valorTotal = valorTotal;
        this.dataPrevistaRecebimento = dataPrevistaRecebimento;
        this.registro = registro;
        this.ativo = ativo;
    }
}
