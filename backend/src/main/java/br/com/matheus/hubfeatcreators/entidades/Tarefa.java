package br.com.matheus.hubfeatcreators.entidades;

import br.com.matheus.hubfeatcreators.entidades.superclasses.Entidade;
import br.com.matheus.hubfeatcreators.enums.PrioridadeTarefa;
import br.com.matheus.hubfeatcreators.enums.StatusTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoLembreteTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoRecorrenciaTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoResponsavelTarefa;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "TAREFA")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tarefa extends Entidade implements br.com.matheus.hubfeatcreators.interfaces.Desativavel {

    @NotBlank(message = "Título é obrigatório")
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Enumerated(EnumType.STRING)
    private StatusTarefa status;

    @Enumerated(EnumType.STRING)
    private PrioridadeTarefa prioridade;

    @NotNull(message = "Tipo de responsável é obrigatório")
    @Enumerated(EnumType.STRING)
    private TipoResponsavelTarefa tipoResponsavel;

    /** Responsável quando tipo = ASSESSORA. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_responsavel_id")
    private Usuario usuarioResponsavel;

    /** Responsável quando tipo = INFLUENCIADOR. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "influenciador_responsavel_id")
    private Influenciador influenciadorResponsavel;

    /** Vínculo opcional com influenciador. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "influenciador_id")
    private Influenciador influenciador;

    /** Vínculo opcional com marca. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "marca_id")
    private Marca marca;

    /** Origem opcional: publicidade que gerou a tarefa. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publicidade_id")
    private Publicidade publicidade;

    /** Origem opcional: prospecção que gerou a tarefa. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prospecao_id")
    private Prospecao prospecao;

    private LocalDate dataInicio;

    private LocalDate previsaoExecucao;

    private LocalDate dataExecucao;

    private LocalDate previsaoTermino;

    /** Preenchida automaticamente ao concluir; limpa ao sair de CONCLUIDA. */
    private LocalDate dataConclusao;

    /** Quando true, envia e-mails automáticos (atribuição + lembretes). Default: manual. */
    private Boolean notificacaoAutomatica = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "TAREFA_LEMBRETE", joinColumns = @JoinColumn(name = "tarefa_id"))
    @Column(name = "tipo")
    @NotAudited
    private Set<TipoLembreteTarefa> lembretes = new HashSet<>();

    @OneToMany(mappedBy = "tarefa", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordem ASC")
    @NotAudited
    private List<TarefaChecklistItem> checklist = new ArrayList<>();

    /** Frequência de recorrência; null = não recorrente. Exige previsão de término. */
    @Enumerated(EnumType.STRING)
    private TipoRecorrenciaTarefa recorrencia;

    /** Repetir até esta data (opcional). */
    private LocalDate recorrenciaFim;

    /** Número máximo de ocorrências da série (opcional). */
    private Integer recorrenciaMaxOcorrencias;

    /** Número desta ocorrência na série (1 = original). Gerenciado pelo sistema. */
    private Integer recorrenciaOcorrencia = 1;

    /** Ocorrência anterior que gerou esta (rastreabilidade). Gerenciado pelo sistema. */
    private UUID recorrenciaAnteriorId;

    private boolean ativo = true;

    /** Flag interna: responsável mudou no update — dispara e-mail de atribuição quando automático. */
    @Transient
    @JsonIgnore
    private boolean responsavelAlterado;

    /** Status antes do update genérico (PUT) — detecta transição para CONCLUIDA. */
    @Transient
    @JsonIgnore
    private StatusTarefa statusAnterior;

    @Override
    public void desativar() {
        this.ativo = false;
    }

    @Override
    public void restaurar() {
        this.ativo = true;
    }
}
