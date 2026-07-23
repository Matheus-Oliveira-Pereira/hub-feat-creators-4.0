package br.com.matheus.hubfeatcreators.visoes.telas.tarefa;

import br.com.matheus.hubfeatcreators.enums.PrioridadeTarefa;
import br.com.matheus.hubfeatcreators.enums.StatusTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoRecorrenciaTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoResponsavelTarefa;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class TarefaDTO {

    private UUID id;
    private String titulo;
    private StatusTarefa status;
    private PrioridadeTarefa prioridade;
    private TipoResponsavelTarefa tipoResponsavel;
    private String usuarioResponsavelNome;
    private String influenciadorResponsavelNome;
    private String influenciadorNome;
    private String marcaNome;
    private LocalDate dataInicio;
    private LocalDate previsaoExecucao;
    private LocalDate previsaoTermino;
    private LocalDate dataConclusao;
    private Boolean notificacaoAutomatica;
    private TipoRecorrenciaTarefa recorrencia;
    private Long totalChecklist;
    private Long checklistConcluidos;
    private boolean ativo;

    public TarefaDTO(UUID id, String titulo, StatusTarefa status, PrioridadeTarefa prioridade,
                     TipoResponsavelTarefa tipoResponsavel, String usuarioResponsavelNome,
                     String influenciadorResponsavelNome, String influenciadorNome, String marcaNome,
                     LocalDate dataInicio, LocalDate previsaoExecucao, LocalDate previsaoTermino,
                     LocalDate dataConclusao, Boolean notificacaoAutomatica, TipoRecorrenciaTarefa recorrencia,
                     Long totalChecklist, Long checklistConcluidos, boolean ativo) {
        this.id = id;
        this.titulo = titulo;
        this.status = status;
        this.prioridade = prioridade;
        this.tipoResponsavel = tipoResponsavel;
        this.usuarioResponsavelNome = usuarioResponsavelNome;
        this.influenciadorResponsavelNome = influenciadorResponsavelNome;
        this.influenciadorNome = influenciadorNome;
        this.marcaNome = marcaNome;
        this.dataInicio = dataInicio;
        this.previsaoExecucao = previsaoExecucao;
        this.previsaoTermino = previsaoTermino;
        this.dataConclusao = dataConclusao;
        this.notificacaoAutomatica = notificacaoAutomatica;
        this.recorrencia = recorrencia;
        this.totalChecklist = totalChecklist;
        this.checklistConcluidos = checklistConcluidos;
        this.ativo = ativo;
    }
}
