package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.MidiaKitTemplate;
import br.com.matheus.hubfeatcreators.entidades.SessaoMidiaKit;
import br.com.matheus.hubfeatcreators.entidades.superclasses.EsteticaSessao;
import br.com.matheus.hubfeatcreators.enums.StatusMidiaKitTemplate;
import br.com.matheus.hubfeatcreators.enums.TipoSessao;
import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import br.com.matheus.hubfeatcreators.repositorios.MidiaKitTemplateRepository;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.repositorios.SessaoMidiaKitRepository;
import br.com.matheus.hubfeatcreators.visoes.repositorios.MidiaKitTemplateDTORepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MidiaKitTemplateServiceTest {

    @Mock
    private MidiaKitTemplateRepository repository;

    @Mock
    private MidiaKitTemplateDTORepository dtoRepository;

    @Mock
    private InfluenciadorRepository influenciadorRepository;

    @Mock
    private ClaudeVisionService visionService;

    @Mock
    private SessaoMidiaKitRepository sessaoRepository;

    @InjectMocks
    private MidiaKitTemplateService service;

    @BeforeEach
    void injetarRepositorioHerdado() {
        // Mockito não injeta o campo genérico "repository" herdado de EntidadeService (type erasure).
        ReflectionTestUtils.setField(service, "repository", repository);
    }

    private SessaoMidiaKit sessaoCompleta(TipoSessao tipo) {
        SessaoMidiaKit s = new SessaoMidiaKit();
        s.setId(UUID.randomUUID());
        s.setTipo(tipo);
        s.setOrdem(0);
        s.setTitulo("Título");
        s.setAtiva(false);
        s.setConteudo("Conteúdo");
        s.setAnalyticsJson("{\"seguidores\":100}");
        s.setFotos("[\"data:image/jpeg;base64,abc\"]");
        s.setConfig("{\"comando\":\"extraia tudo\"}");
        EsteticaSessao est = new EsteticaSessao();
        est.setCorFundo("#111111");
        est.setEscalaFotos(120);
        s.setEstetica(est);
        return s;
    }

    private MidiaKitTemplate templateCom(SessaoMidiaKit... sessoes) {
        MidiaKitTemplate t = new MidiaKitTemplate();
        t.setId(UUID.randomUUID());
        t.setNome("Kit");
        t.setStatus(StatusMidiaKitTemplate.ATIVO);
        t.setSessoes(new ArrayList<>());
        for (SessaoMidiaKit s : sessoes) {
            s.setTemplate(t);
            t.getSessoes().add(s);
        }
        return t;
    }

    // ---------- copiar ----------

    @Test
    void copiarReplicaTodosOsCamposDaSessao() {
        SessaoMidiaKit origem = sessaoCompleta(TipoSessao.INSIGHTS_INSTAGRAM);
        MidiaKitTemplate original = templateCom(origem);
        when(repository.findById(original.getId())).thenReturn(Optional.of(original));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MidiaKitTemplate copia = service.copiar(original.getId(), null);

        assertEquals("Kit (cópia)", copia.getNome());
        assertEquals(StatusMidiaKitTemplate.ATIVO, copia.getStatus());
        assertEquals(1, copia.getSessoes().size());
        SessaoMidiaKit nova = copia.getSessoes().get(0);
        assertNull(nova.getId());
        assertEquals(origem.getTipo(), nova.getTipo());
        assertEquals(origem.getTitulo(), nova.getTitulo());
        assertEquals(origem.getAtiva(), nova.getAtiva());
        assertEquals(origem.getConteudo(), nova.getConteudo());
        assertEquals(origem.getAnalyticsJson(), nova.getAnalyticsJson());
        assertEquals(origem.getFotos(), nova.getFotos());
        assertEquals(origem.getConfig(), nova.getConfig());
        assertNotNull(nova.getEstetica());
        assertEquals("#111111", nova.getEstetica().getCorFundo());
        assertEquals(120, nova.getEstetica().getEscalaFotos());
        assertSame(copia, nova.getTemplate());
    }

    // ---------- copyProperties (sync por id) ----------

    @Test
    void copyPropertiesAtualizaSessaoExistenteInPlace() {
        SessaoMidiaKit persistida = sessaoCompleta(TipoSessao.SOBRE_INFLUENCIADOR);
        MidiaKitTemplate target = templateCom(persistida);

        SessaoMidiaKit enviada = sessaoCompleta(TipoSessao.SOBRE_INFLUENCIADOR);
        enviada.setId(persistida.getId());
        enviada.setTitulo("Título novo");
        SessaoMidiaKit novaSemId = sessaoCompleta(TipoSessao.CONTEUDOS);
        novaSemId.setId(null);
        MidiaKitTemplate source = templateCom(enviada, novaSemId);

        service.copyProperties(source, target);

        assertEquals(2, target.getSessoes().size());
        assertSame(persistida, target.getSessoes().get(0)); // mesma instância gerenciada
        assertEquals("Título novo", persistida.getTitulo());
        assertNull(target.getSessoes().get(1).getId());
        assertSame(target, target.getSessoes().get(1).getTemplate());
    }

    @Test
    void copyPropertiesRemoveSessoesAusentesNoPayload() {
        SessaoMidiaKit fica = sessaoCompleta(TipoSessao.CAPA);
        SessaoMidiaKit sai = sessaoCompleta(TipoSessao.CONTATO);
        MidiaKitTemplate target = templateCom(fica, sai);

        SessaoMidiaKit enviada = sessaoCompleta(TipoSessao.CAPA);
        enviada.setId(fica.getId());
        MidiaKitTemplate source = templateCom(enviada);

        service.copyProperties(source, target);

        assertEquals(1, target.getSessoes().size());
        assertSame(fica, target.getSessoes().get(0));
    }

    // ---------- validarSessoes ----------

    @Test
    void validarSessoesBloqueiaConfigJsonInvalido() {
        SessaoMidiaKit s = sessaoCompleta(TipoSessao.CAPA);
        s.setConfig("{invalido");
        MidiaKitTemplate t = templateCom(s);

        assertThrows(ConfiguracaoInvalidaException.class, () -> service.validarSessoes(t));
    }

    @Test
    void validarSessoesBloqueiaSecaoSemConteudo() {
        SessaoMidiaKit s = sessaoCompleta(TipoSessao.CONTEUDOS);
        s.setConteudo(null);
        s.setAnalyticsJson(null);
        s.setFotos("[]");
        MidiaKitTemplate t = templateCom(s);

        assertThrows(ConfiguracaoInvalidaException.class, () -> service.validarSessoes(t));
    }

    @Test
    void validarSessoesIsentaCapaEContatoDeConteudo() {
        SessaoMidiaKit capa = sessaoCompleta(TipoSessao.CAPA);
        capa.setConteudo(null);
        capa.setAnalyticsJson(null);
        capa.setFotos(null);
        SessaoMidiaKit contato = sessaoCompleta(TipoSessao.CONTATO);
        contato.setConteudo(null);
        contato.setAnalyticsJson(null);
        contato.setFotos(null);
        MidiaKitTemplate t = templateCom(capa, contato);

        assertDoesNotThrow(() -> service.validarSessoes(t));
    }

    @Test
    void validarSessoesAceitaFotoComoConteudo() {
        SessaoMidiaKit s = sessaoCompleta(TipoSessao.CONTEUDOS);
        s.setConteudo(null);
        s.setAnalyticsJson(null); // só foto
        MidiaKitTemplate t = templateCom(s);

        assertDoesNotThrow(() -> service.validarSessoes(t));
    }
}
