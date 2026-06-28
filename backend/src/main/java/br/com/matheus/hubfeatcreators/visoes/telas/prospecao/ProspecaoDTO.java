package br.com.matheus.hubfeatcreators.visoes.telas.prospecao;

import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
import br.com.matheus.hubfeatcreators.enums.TipoProspecao;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ProspecaoDTO {

    private UUID id;
    private String influenciadorNome;
    private String marcaNome;
    private TipoProspecao tipo;
    private StatusProspecao status;
    private LocalDate dataContato;
    private BigDecimal valorAceito;
    private BigDecimal valorProposto;
    private boolean ativo;

    public ProspecaoDTO(UUID id, String influenciadorNome, String marcaNome, TipoProspecao tipo,
                        StatusProspecao status, LocalDate dataContato, BigDecimal valorAceito,
                        BigDecimal valorProposto, boolean ativo) {
        this.id = id;
        this.influenciadorNome = influenciadorNome;
        this.marcaNome = marcaNome;
        this.tipo = tipo;
        this.status = status;
        this.dataContato = dataContato;
        this.valorAceito = valorAceito;
        this.valorProposto = valorProposto;
        this.ativo = ativo;
    }
}
