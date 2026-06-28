package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContatoMarca;
import br.com.matheus.hubfeatcreators.entidades.Email;
import br.com.matheus.hubfeatcreators.entidades.FollowUp;
import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.entidades.Marca;
import br.com.matheus.hubfeatcreators.entidades.Prospecao;
import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
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
            entidade.setStatus(StatusProspecao.RASCUNHO);
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

    /** Registra um follow-up e dispara e-mail ao contato da marca. */
    public FollowUp registrarFollowUp(UUID prospecaoId, FollowUp followUp) {
        Prospecao prospecao = buscar(prospecaoId);

        if (prospecao.getContatoMarca() == null || prospecao.getContatoMarca().getEmail() == null
                || prospecao.getContatoMarca().getEmail().isBlank()) {
            throw new RegraNegocioException("A prospecção não possui um contato de marca com e-mail para o follow-up.");
        }

        followUp.setProspecao(prospecao);
        followUp.setStatusProspecao(prospecao.getStatus());
        if (followUp.getData() == null) {
            followUp.setData(LocalDateTime.now());
        }

        String titulo = "Follow-up — " + prospecao.getMarca().getNome();
        String conteudo = followUp.getObservacao() != null && !followUp.getObservacao().isBlank()
                ? "<p>" + followUp.getObservacao() + "</p>"
                : "<p>Olá! Retomando nosso contato sobre a parceria com "
                        + prospecao.getInfluenciador().getNome() + ".</p>";

        Email email = new Email(titulo, conteudo, List.of(prospecao.getContatoMarca().getEmail()));
        LogEmail logEmail = emailService.enviarSync(email, prospecao.getInfluenciador());
        followUp.setLogEmail(logEmail);

        prospecao.getFollowUps().add(followUp);
        super.salvar(prospecao);
        return followUp;
    }

    private void validar(Prospecao p) {
        if (p.getStatus() == StatusProspecao.ENCERRADO
                && (p.getMotivoEncerramento() == null || p.getMotivoEncerramento().isBlank())) {
            throw new RegraNegocioException("Informe o motivo do encerramento.");
        }
    }
}
