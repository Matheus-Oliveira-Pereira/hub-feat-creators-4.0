package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
import br.com.matheus.hubfeatcreators.enums.TipoProspecao;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PROSPECAO")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Prospecao extends Entidade implements br.com.matheus.hubfeatcreators.interfaces.Desativavel {

    @NotNull(message = "Influenciador é obrigatório")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "influenciador_id")
    private Influenciador influenciador;

    @NotNull(message = "Marca é obrigatória")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "marca_id")
    private Marca marca;

    /** Contato da marca para quem os follow-ups são enviados. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contato_marca_id")
    private ContatoMarca contatoMarca;

    private LocalDate dataContato;

    @Enumerated(EnumType.STRING)
    private TipoProspecao tipo;

    private String nicho;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    private BigDecimal valorProposto;

    private BigDecimal valorAceito;

    private BigDecimal valorContraproposto;

    @Enumerated(EnumType.STRING)
    private StatusProspecao status;

    /** Confirma o envio do e-mail de contato inicial (automático ao enviar, ou marcado manualmente). */
    private Boolean emailContatoInicialEnviado = false;

    /** Data do envio automático do e-mail de contato inicial; base da regra de follow-up. */
    private java.time.LocalDateTime dataEmailContatoInicial;

    /** Rastreabilidade: id da publicidade gerada ao fechar a prospecção. */
    private java.util.UUID publicidadeId;

    @Column(columnDefinition = "TEXT")
    private String motivoEncerramento;

    private boolean ativo = true;

    @OneToMany(mappedBy = "prospecao", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("data DESC")
    @NotAudited
    private List<FollowUp> followUps = new ArrayList<>();

    /** Publicidade gerada quando a prospecção é fechada. */
    @OneToOne(mappedBy = "prospecao", fetch = FetchType.LAZY)
    @NotAudited
    @JsonIgnore
    private Publicidade publicidade;

    @Override
    public void desativar() {
        this.ativo = false;
    }

    @Override
    public void restaurar() {
        this.ativo = true;
    }
}
