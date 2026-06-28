package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PUBLICIDADE")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Publicidade extends Entidade implements br.com.matheus.hubfeatcreators.interfaces.Desativavel {

    @NotNull(message = "Marca é obrigatória")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "marca_id")
    private Marca marca;

    @NotNull(message = "Influenciador é obrigatório")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "influenciador_id")
    private Influenciador influenciador;

    /** Prospecção que originou esta publicidade (opcional). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prospecao_id")
    private Prospecao prospecao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    private String parceiro;

    private BigDecimal porcentagemAssessora = new BigDecimal("20");

    private boolean ativo = true;

    @OneToOne(mappedBy = "publicidade", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @NotAudited
    private PublicidadeFinanceiro financeiro;

    @OneToMany(mappedBy = "publicidade", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @NotAudited
    private List<PublicidadeEntregavel> entregaveis = new ArrayList<>();

    @Override
    public void desativar() {
        this.ativo = false;
    }

    @Override
    public void restaurar() {
        this.ativo = true;
    }
}
