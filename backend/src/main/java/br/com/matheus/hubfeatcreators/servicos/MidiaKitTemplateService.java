package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.MidiaKitTemplate;
import br.com.matheus.hubfeatcreators.entidades.SessaoMidiaKit;
import br.com.matheus.hubfeatcreators.enums.StatusMidiaKitTemplate;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.repositorios.MidiaKitTemplateRepository;
import br.com.matheus.hubfeatcreators.repositorios.SessaoMidiaKitRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.MidiaKitTemplateDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.midiakit.MidiaKitTemplateDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MidiaKitTemplateService extends EntidadeService<MidiaKitTemplate, MidiaKitTemplateRepository> {

    @Autowired
    private MidiaKitTemplateDTORepository dtoRepository;

    @Autowired
    private InfluenciadorRepository influenciadorRepository;

    @Autowired
    private ClaudeVisionService visionService;

    @Autowired
    private SessaoMidiaKitRepository sessaoRepository;

    private static final ObjectMapper JSON = new ObjectMapper();

    public PaginatedResponse<MidiaKitTemplateDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<MidiaKitTemplate> listarAtivos() {
        return repository.findByStatus(StatusMidiaKitTemplate.ATIVO);
    }

    /** Fluxo "enviar só os prints novos": roda vision na seção e salva SÓ a sessão
     *  (evita reescrever o template inteiro e conflitar com edições concorrentes). */
    public SessaoMidiaKit analisarSessao(UUID templateId, UUID sessaoId, List<MultipartFile> prints, String comando) {
        MidiaKitTemplate template = buscar(templateId);
        SessaoMidiaKit sessao = template.getSessoes().stream()
                .filter(s -> s.getId().equals(sessaoId))
                .findFirst()
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Sessão não encontrada com id: " + sessaoId));

        String json = visionService.analisarPrints(sessao.getTipo(), prints, comando);
        sessao.setAnalyticsJson(json);
        return sessaoRepository.save(sessao);
    }

    /** Tipos cuja seção é preenchida a partir do influenciador (não exigem conteúdo próprio). */
    private static final java.util.Set<br.com.matheus.hubfeatcreators.enums.TipoSessao> TIPOS_AUTO =
            java.util.EnumSet.of(br.com.matheus.hubfeatcreators.enums.TipoSessao.CAPA,
                    br.com.matheus.hubfeatcreators.enums.TipoSessao.CONTATO);

    @Override
    public MidiaKitTemplate salvar(MidiaKitTemplate entidade) {
        if (entidade.getStatus() == null) {
            entidade.setStatus(StatusMidiaKitTemplate.ATIVO);
        }
        validarSessoes(entidade);
        resolverInfluenciador(entidade);
        reindexarSessoes(entidade);
        return super.salvar(entidade);
    }

    /** Bloqueia seção sem nenhum conteúdo (texto, fotos ou analytics) e config JSON inválido; CAPA/CONTATO isentos de conteúdo. */
    void validarSessoes(MidiaKitTemplate template) {
        if (template.getSessoes() == null) return;
        for (SessaoMidiaKit s : template.getSessoes()) {
            String label = s.getTitulo() != null && !s.getTitulo().isBlank() ? s.getTitulo() : s.getTipo().getLabel();
            if (s.getConfig() != null && !s.getConfig().isBlank()) {
                try {
                    JSON.readTree(s.getConfig());
                } catch (Exception e) {
                    throw new br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException(
                            "A configuração da seção \"" + label + "\" está corrompida (JSON inválido).");
                }
            }
            if (TIPOS_AUTO.contains(s.getTipo())) continue;
            boolean temConteudo = (s.getConteudo() != null && !s.getConteudo().isBlank())
                    || (s.getAnalyticsJson() != null && !s.getAnalyticsJson().isBlank())
                    || (s.getFotos() != null && !s.getFotos().isBlank() && !s.getFotos().equals("[]"));
            if (!temConteudo) {
                throw new br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException(
                        "A seção \"" + label + "\" está sem conteúdo. Adicione texto, fotos ou analytics, ou remova a seção.");
            }
        }
    }

    /** Carrega o influenciador gerenciado a partir do id enviado (evita entidade transiente/detached). */
    private void resolverInfluenciador(MidiaKitTemplate template) {
        Influenciador influ = template.getInfluenciador();
        if (influ != null && influ.getId() != null) {
            Influenciador gerenciado = influenciadorRepository.findById(influ.getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Influenciador não encontrado com id: " + influ.getId()));
            template.setInfluenciador(gerenciado);
        }
    }

    /**
     * Atualização: copia campos simples e sincroniza as sessões DENTRO da coleção gerenciada
     * (orphanRemoval exige mutar a mesma instância, não substituí-la). Sessões existentes são
     * casadas por id e atualizadas in-place (preserva id/versão/auditoria); as que não vierem
     * no payload são removidas (órfãs); sem id entram como novas.
     */
    @Override
    public void copyProperties(MidiaKitTemplate source, MidiaKitTemplate target) {
        org.springframework.beans.BeanUtils.copyProperties(source, target, "id", "versao", "registro", "criadoPor", "sessoes");

        java.util.Map<UUID, SessaoMidiaKit> existentes = new java.util.HashMap<>();
        for (SessaoMidiaKit s : target.getSessoes()) {
            if (s.getId() != null) existentes.put(s.getId(), s);
        }

        List<SessaoMidiaKit> resultado = new ArrayList<>();
        if (source.getSessoes() != null) {
            for (SessaoMidiaKit enviada : source.getSessoes()) {
                SessaoMidiaKit alvo = enviada.getId() != null ? existentes.get(enviada.getId()) : null;
                if (alvo != null) {
                    copiarConteudoSessao(enviada, alvo);
                    resultado.add(alvo);
                } else {
                    enviada.setId(null);
                    enviada.setTemplate(target);
                    resultado.add(enviada);
                }
            }
        }
        target.getSessoes().clear();
        target.getSessoes().addAll(resultado);
    }

    /** Garante template setado em cada sessão e ordem sequencial. */
    private void reindexarSessoes(MidiaKitTemplate template) {
        if (template.getSessoes() == null) {
            return;
        }
        int ordem = 0;
        for (SessaoMidiaKit sessao : template.getSessoes()) {
            sessao.setTemplate(template);
            sessao.setOrdem(ordem++);
        }
    }

    /** Copia um template (deep-copy das sessões), opcionalmente para outro influenciador. */
    public MidiaKitTemplate copiar(UUID templateId, UUID novoInfluenciadorId) {
        MidiaKitTemplate original = buscar(templateId);

        MidiaKitTemplate copia = new MidiaKitTemplate();
        copia.setNome(original.getNome() + " (cópia)");
        copia.setStatus(StatusMidiaKitTemplate.ATIVO);

        if (novoInfluenciadorId != null) {
            Influenciador influenciador = influenciadorRepository.findById(novoInfluenciadorId)
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Influenciador não encontrado com id: " + novoInfluenciadorId));
            copia.setInfluenciador(influenciador);
        } else {
            copia.setInfluenciador(original.getInfluenciador());
        }

        copia.setSessoes(new ArrayList<>());
        for (SessaoMidiaKit origem : original.getSessoes()) {
            SessaoMidiaKit nova = new SessaoMidiaKit();
            nova.setTemplate(copia);
            copiarConteudoSessao(origem, nova);
            copia.getSessoes().add(nova);
        }

        return super.salvar(copia);
    }

    /** Replica TODOS os campos de conteúdo/config/estética de uma seção (evita perda de dados na cópia). */
    void copiarConteudoSessao(SessaoMidiaKit origem, SessaoMidiaKit destino) {
        destino.setTipo(origem.getTipo());
        destino.setOrdem(origem.getOrdem());
        destino.setTitulo(origem.getTitulo());
        destino.setAtiva(origem.getAtiva());
        destino.setConteudo(origem.getConteudo());
        destino.setAnalyticsJson(origem.getAnalyticsJson());
        destino.setFotos(origem.getFotos());
        destino.setConfig(origem.getConfig());
        destino.setEstetica(origem.getEstetica());
    }
}
