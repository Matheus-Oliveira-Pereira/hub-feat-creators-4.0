package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.FormaPagamento;
import br.com.matheus.hubfeatcreators.enums.StatusFinanceiro;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "PUBLICIDADE_FINANCEIRO")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicidadeFinanceiro extends Entidade {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publicidade_id")
    @JsonIgnore
    private Publicidade publicidade;

    private LocalDate dataEnvioNota;

    @Enumerated(EnumType.STRING)
    private StatusFinanceiro status;

    @Enumerated(EnumType.STRING)
    private FormaPagamento formaPagamento;

    private LocalDate dataRecebimento;

    private LocalDate dataPrevistaRecebimento;

    private BigDecimal valorTotal;

    private BigDecimal valorAssessora;

    private BigDecimal valorInfluenciador;
}
