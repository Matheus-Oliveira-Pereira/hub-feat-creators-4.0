package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContatoMarca;
import br.com.matheus.hubfeatcreators.entidades.Email;
import br.com.matheus.hubfeatcreators.entidades.FollowUp;
import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.entidades.Marca;
import br.com.matheus.hubfeatcreators.entidades.Prospecao;
import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
import br.com.matheus.hubfeatcreators.enums.TipoProspecao;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.exceptions.RegraNegocioException;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.repositorios.MarcaRepository;
import br.com.matheus.hubfeatcreators.repositorios.ProspecaoRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.ProspecaoDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.prospecao.ProspecaoDTO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProspecaoService extends EntidadeService<Prospecao, ProspecaoRepository> {

    @Autowired
    private ProspecaoDTORepository dtoRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private InfluenciadorRepository influenciadorRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    public PaginatedResponse<ProspecaoDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<Prospecao> listarPorInfluenciador(UUID influenciadorId) {
        return repository.findByInfluenciadorIdAndAtivoTrueOrderByRegistroAsc(influenciadorId);
    }

    @Override
    @Transactional
    public Prospecao salvar(Prospecao entidade) {
        if (entidade.getStatus() == null) {
            entidade.setStatus(entidade.getTipo() == TipoProspecao.RECEPTIVO
                    ? StatusProspecao.CONTATO_INICIAL
                    : StatusProspecao.RASCUNHO);
        }
        resolverReferencias(entidade);
        validar(entidade);
        return super.salvar(entidade);
    }

    /** Substitui as referências enviadas como {id} por entidades gerenciadas (evita erro de versão em entidade detached). */
    private void resolverReferencias(Prospecao p) {
        if (p.getInfluenciador() != null && p.getInfluenciador().getId() != null) {
            Influenciador influ = influenciadorRepository.findById(p.getInfluenciador().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Influenciador não encontrado."));
            p.setInfluenciador(influ);
        }
        if (p.getMarca() != null && p.getMarca().getId() != null) {
            Marca marca = marcaRepository.findById(p.getMarca().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Marca não encontrada."));
            p.setMarca(marca);
            if (p.getContatoMarca() != null && p.getContatoMarca().getId() != null) {
                ContatoMarca contato = marca.getContatos().stream()
                        .filter(c -> c.getId().equals(p.getContatoMarca().getId()))
                        .findFirst()
                        .orElseThrow(() -> new RegraNegocioException("O contato selecionado não pertence à marca da prospecção."));
                p.setContatoMarca(contato);
            } else {
                p.setContatoMarca(null);
            }
        }
    }

    /** Atualiza campos simples; follow-ups são gerenciados pelo endpoint dedicado e preservados. */
    @Override
    public void copyProperties(Prospecao source, Prospecao target) {
        BeanUtils.copyProperties(source, target,
                "id", "versao", "registro", "criadoPor", "followUps", "publicidade");
    }

    /** Registra um follow-up e dispara e-mail ao contato da marca (assunto/corpo vindos do painel). */
    public FollowUp registrarFollowUp(UUID prospecaoId, String assunto, String corpo, String observacoes) {
        return registrarFollowUp(prospecaoId, assunto, corpo, observacoes, null, null);
    }

    /** Follow-up com CC/BCC opcionais. */
    public FollowUp registrarFollowUp(UUID prospecaoId, String assunto, String corpo, String observacoes,
                                      List<String> cc, List<String> cco) {
        Prospecao prospecao = buscar(prospecaoId);
        String destino = validarContatoEmail(prospecao);

        FollowUp followUp = new FollowUp();
        followUp.setProspecao(prospecao);
        followUp.setStatusProspecao(prospecao.getStatus());
        followUp.setData(LocalDateTime.now());
        followUp.setObservacao(corpo);
        followUp.setObservacoes(observacoes);

        String tituloFinal = (assunto != null && !assunto.isBlank())
                ? assunto : "Follow-up — " + prospecao.getMarca().getNome();
        String conteudoFinal = (corpo != null && !corpo.isBlank())
                ? corpo
                : "<p>Olá! Retomando nosso contato sobre a parceria com "
                        + prospecao.getInfluenciador().getNome() + ".</p>";

        Email email = new Email(tituloFinal, conteudoFinal, List.of(destino));
        aplicarCopias(email, cc, cco);
        LogEmail logEmail = emailService.enviarSync(email, prospecao.getInfluenciador());
        followUp.setLogEmail(logEmail);

        prospecao.getFollowUps().add(followUp);
        super.salvar(prospecao);
        return followUp;
    }

    /** Envia e-mail de contato inicial ao contato da marca (não registra histórico de follow-up). */
    public LogEmail enviarEmailContato(UUID prospecaoId, String assunto, String corpo) {
        return enviarEmailContato(prospecaoId, assunto, corpo, null, null);
    }

    /** Contato inicial com CC/BCC opcionais. */
    public LogEmail enviarEmailContato(UUID prospecaoId, String assunto, String corpo, List<String> cc, List<String> cco) {
        Prospecao prospecao = buscar(prospecaoId);
        String destino = validarContatoEmail(prospecao);
        Email email = new Email(
                assunto != null ? assunto : "Contato — " + prospecao.getMarca().getNome(),
                corpo != null ? corpo : "",
                List.of(destino));
        aplicarCopias(email, cc, cco);
        LogEmail logEmail = emailService.enviarSync(email, prospecao.getInfluenciador());

        // Confirma o contato inicial e guarda a data (base da regra de follow-up).
        if (logEmail.getStatus() == LogEmail.Status.SUCESSO) {
            prospecao.setEmailContatoInicialEnviado(true);
            if (prospecao.getDataEmailContatoInicial() == null) {
                prospecao.setDataEmailContatoInicial(LocalDateTime.now());
            }
            super.salvar(prospecao);
        }
        return logEmail;
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

    private String validarContatoEmail(Prospecao prospecao) {
        if (prospecao.getContatoMarca() == null || prospecao.getContatoMarca().getEmail() == null
                || prospecao.getContatoMarca().getEmail().isBlank()) {
            throw new RegraNegocioException("A prospecção não possui um contato de marca com e-mail.");
        }
        return prospecao.getContatoMarca().getEmail();
    }

    private void validar(Prospecao p) {
        if (p.getStatus() == StatusProspecao.ENCERRADO
                && (p.getMotivoEncerramento() == null || p.getMotivoEncerramento().isBlank())) {
            throw new RegraNegocioException("Informe o motivo do encerramento.");
        }
    }
}
