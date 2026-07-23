package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Email;
import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.entidades.Tarefa;
import br.com.matheus.hubfeatcreators.enums.PrioridadeTarefa;
import br.com.matheus.hubfeatcreators.enums.StatusTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoLembreteTarefa;
import br.com.matheus.hubfeatcreators.enums.TipoResponsavelTarefa;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.exceptions.RegraNegocioException;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.repositorios.MarcaRepository;
import br.com.matheus.hubfeatcreators.repositorios.ProspecaoRepository;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeRepository;
import br.com.matheus.hubfeatcreators.repositorios.TarefaRepository;
import br.com.matheus.hubfeatcreators.repositorios.UsuarioRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.TarefaDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.tarefa.TarefaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TarefaService extends EntidadeService<Tarefa, TarefaRepository> {

    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final TarefaDTORepository dtoRepository;

    private final EmailService emailService;

    private final UsuarioRepository usuarioRepository;

    private final InfluenciadorRepository influenciadorRepository;

    private final MarcaRepository marcaRepository;

    private final PublicidadeRepository publicidadeRepository;

    private final ProspecaoRepository prospecaoRepository;

    public PaginatedResponse<TarefaDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    @Override
    @Transactional
    public Tarefa salvar(Tarefa entidade) {
        boolean novo = entidade.getId() == null;

        if (entidade.getStatus() == null) {
            entidade.setStatus(StatusTarefa.A_FAZER);
        }
        if (entidade.getPrioridade() == null) {
            entidade.setPrioridade(PrioridadeTarefa.MEDIA);
        }
        if (entidade.getNotificacaoAutomatica() == null) {
            entidade.setNotificacaoAutomatica(false);
        }

        resolverReferencias(entidade);
        validarResponsavel(entidade);

        // Religa back-references e normaliza a ordem do checklist.
        var checklist = entidade.getChecklist();
        for (int idx = 0; idx < checklist.size(); idx++) {
            checklist.get(idx).setTarefa(entidade);
            checklist.get(idx).setOrdem(idx);
        }

        aplicarRegraConclusao(entidade);

        Tarefa salva = super.salvar(entidade);

        if ((novo || entidade.isResponsavelAlterado()) && Boolean.TRUE.equals(salva.getNotificacaoAutomatica())) {
            emailService.enviar(construirEmailAtribuicao(salva), influenciadorParaConta(salva));
        }
        return salva;
    }

    /** Conclusão: data automática ao entrar em CONCLUIDA; limpa ao sair (reabertura). */
    private void aplicarRegraConclusao(Tarefa t) {
        if (t.getStatus() == StatusTarefa.CONCLUIDA) {
            if (t.getDataConclusao() == null) {
                t.setDataConclusao(LocalDate.now());
            }
        } else {
            t.setDataConclusao(null);
        }
    }

    /** Substitui as referências enviadas como {id} por entidades gerenciadas (evita erro de versão em entidade detached). */
    private void resolverReferencias(Tarefa t) {
        if (t.getUsuarioResponsavel() != null && t.getUsuarioResponsavel().getId() != null) {
            t.setUsuarioResponsavel(usuarioRepository.findById(t.getUsuarioResponsavel().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Usuário responsável não encontrado.")));
        }
        if (t.getInfluenciadorResponsavel() != null && t.getInfluenciadorResponsavel().getId() != null) {
            t.setInfluenciadorResponsavel(influenciadorRepository.findById(t.getInfluenciadorResponsavel().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Influenciador responsável não encontrado.")));
        }
        if (t.getInfluenciador() != null && t.getInfluenciador().getId() != null) {
            t.setInfluenciador(influenciadorRepository.findById(t.getInfluenciador().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Influenciador não encontrado.")));
        }
        if (t.getMarca() != null && t.getMarca().getId() != null) {
            t.setMarca(marcaRepository.findById(t.getMarca().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Marca não encontrada.")));
        }
        if (t.getPublicidade() != null && t.getPublicidade().getId() != null) {
            t.setPublicidade(publicidadeRepository.findById(t.getPublicidade().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Publicidade não encontrada.")));
        }
        if (t.getProspecao() != null && t.getProspecao().getId() != null) {
            t.setProspecao(prospecaoRepository.findById(t.getProspecao().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Prospecção não encontrada.")));
        }
    }

    /** Exatamente um responsável, coerente com o tipo. */
    private void validarResponsavel(Tarefa t) {
        if (t.getTipoResponsavel() == TipoResponsavelTarefa.ASSESSORA) {
            if (t.getUsuarioResponsavel() == null) {
                throw new RegraNegocioException("Informe o usuário responsável pela tarefa.");
            }
            t.setInfluenciadorResponsavel(null);
        } else if (t.getTipoResponsavel() == TipoResponsavelTarefa.INFLUENCIADOR) {
            if (t.getInfluenciadorResponsavel() == null) {
                throw new RegraNegocioException("Informe o influenciador responsável pela tarefa.");
            }
            t.setUsuarioResponsavel(null);
        }
    }

    /**
     * Atualiza campos simples; coleções são mescladas in-place — substituir a referência de
     * coleção orphanRemoval/ElementCollection quebra o Hibernate ("collection no longer referenced").
     */
    @Override
    public void copyProperties(Tarefa source, Tarefa target) {
        UUID usuarioAntes = target.getUsuarioResponsavel() != null ? target.getUsuarioResponsavel().getId() : null;
        UUID influAntes = target.getInfluenciadorResponsavel() != null ? target.getInfluenciadorResponsavel().getId() : null;
        UUID usuarioDepois = source.getUsuarioResponsavel() != null ? source.getUsuarioResponsavel().getId() : null;
        UUID influDepois = source.getInfluenciadorResponsavel() != null ? source.getInfluenciadorResponsavel().getId() : null;

        BeanUtils.copyProperties(source, target,
                "id", "versao", "registro", "criadoPor", "checklist", "lembretes");

        target.setResponsavelAlterado(
                !Objects.equals(usuarioAntes, usuarioDepois) || !Objects.equals(influAntes, influDepois));

        target.getChecklist().clear();
        source.getChecklist().forEach(item -> {
            item.setTarefa(target);
            target.getChecklist().add(item);
        });

        target.getLembretes().clear();
        target.getLembretes().addAll(source.getLembretes());
    }

    @Transactional
    public Tarefa alterarStatus(UUID id, StatusTarefa novoStatus) {
        if (novoStatus == null) {
            throw new RegraNegocioException("Informe o novo status da tarefa.");
        }
        Tarefa tarefa = buscar(id);
        tarefa.setStatus(novoStatus);
        aplicarRegraConclusao(tarefa);
        return super.salvar(tarefa);
    }

    /** Envio manual ao responsável, com assunto/corpo opcionais (defaults) e CC/BCC. */
    public LogEmail enviarEmailManual(UUID id, String assunto, String corpo, List<String> cc, List<String> cco) {
        Tarefa tarefa = buscar(id);
        String destino = resolverDestinatario(tarefa);

        Email email = new Email(
                assunto != null && !assunto.isBlank() ? assunto : "Tarefa — " + tarefa.getTitulo(),
                corpo != null && !corpo.isBlank() ? corpo : corpoPadrao(tarefa),
                List.of(destino));
        aplicarCopias(email, cc, cco);
        return emailService.enviarSync(email, influenciadorParaConta(tarefa));
    }

    private String resolverDestinatario(Tarefa t) {
        String email = t.getTipoResponsavel() == TipoResponsavelTarefa.ASSESSORA
                ? (t.getUsuarioResponsavel() != null ? t.getUsuarioResponsavel().getEmail() : null)
                : (t.getInfluenciadorResponsavel() != null ? t.getInfluenciadorResponsavel().getEmail() : null);
        if (email == null || email.isBlank()) {
            throw new RegraNegocioException("O responsável pela tarefa não possui e-mail cadastrado.");
        }
        return email;
    }

    /** Conta remetente: influenciador responsável usa a própria ContaEmail; assessora usa a conta do sistema. */
    public Influenciador influenciadorParaConta(Tarefa t) {
        return t.getTipoResponsavel() == TipoResponsavelTarefa.INFLUENCIADOR
                ? t.getInfluenciadorResponsavel()
                : null;
    }

    public Email construirEmailAtribuicao(Tarefa t) {
        return new Email(
                "Nova tarefa atribuída — " + t.getTitulo(),
                corpoPadrao(t),
                List.of(resolverDestinatario(t)));
    }

    public Email construirEmailLembrete(Tarefa t, TipoLembreteTarefa tipo) {
        String quando = switch (tipo) {
            case UMA_SEMANA_ANTES -> "vence em 1 semana";
            case UM_DIA_ANTES -> "vence amanhã";
            case NO_DIA -> "vence hoje";
            case UM_DIA_ATRASO -> "está atrasada (venceu ontem)";
        };
        return new Email(
                "Lembrete: tarefa \"" + t.getTitulo() + "\" " + quando,
                corpoPadrao(t),
                List.of(resolverDestinatario(t)));
    }

    private String corpoPadrao(Tarefa t) {
        var sb = new StringBuilder("<p><strong>").append(t.getTitulo()).append("</strong></p>");
        if (t.getPrioridade() != null) {
            sb.append("<p>Prioridade: ").append(switch (t.getPrioridade()) {
                case BAIXA -> "Baixa";
                case MEDIA -> "Média";
                case ALTA -> "Alta";
            }).append("</p>");
        }
        if (t.getPrevisaoTermino() != null) {
            sb.append("<p>Previsão de término: ").append(t.getPrevisaoTermino().format(DATA_BR)).append("</p>");
        }
        if (t.getDescricao() != null && !t.getDescricao().isBlank()) {
            sb.append("<p>").append(t.getDescricao()).append("</p>");
        }
        return sb.toString();
    }

    /** Aplica CC/BCC opcionais ao e-mail (listas limpas de vazios). */
    private void aplicarCopias(Email email, List<String> cc, List<String> cco) {
        if (cc != null) {
            email.setCopia(cc.stream().filter(e -> e != null && !e.isBlank()).map(String::trim).toList());
        }
        if (cco != null) {
            email.setCopiaOculta(cco.stream().filter(e -> e != null && !e.isBlank()).map(String::trim).toList());
        }
    }
}
