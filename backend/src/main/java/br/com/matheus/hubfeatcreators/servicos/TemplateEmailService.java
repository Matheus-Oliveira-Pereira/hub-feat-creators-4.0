package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Prospecao;
import br.com.matheus.hubfeatcreators.entidades.TemplateEmail;
import br.com.matheus.hubfeatcreators.enums.StatusTemplateEmail;
import br.com.matheus.hubfeatcreators.enums.TipoProspecao;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.repositorios.ProspecaoRepository;
import br.com.matheus.hubfeatcreators.repositorios.TemplateEmailRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.dtos.RenderTemplateDTO;
import br.com.matheus.hubfeatcreators.visoes.repositorios.TemplateEmailDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.templateemail.TemplateEmailDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TemplateEmailService extends EntidadeService<TemplateEmail, TemplateEmailRepository> {

    private static final DateTimeFormatter DATA_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    private TemplateEmailDTORepository dtoRepository;

    @Autowired
    private ProspecaoRepository prospecaoRepository;

    public PaginatedResponse<TemplateEmailDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<TemplateEmail> listarPorTipo(TipoTemplateEmail tipo) {
        return repository.findByTipoAndStatusOrderByNomeAsc(tipo, StatusTemplateEmail.ATIVO);
    }

    @Override
    public TemplateEmail salvar(TemplateEmail entidade) {
        if (entidade.getStatus() == null) {
            entidade.setStatus(StatusTemplateEmail.ATIVO);
        }
        TemplateEmail salvo = super.salvar(entidade);
        // Garante apenas um template "padrão" por tipo.
        if (salvo.isPadrao()) {
            repository.findByTipoAndPadraoTrueAndIdNot(salvo.getTipo(), salvo.getId()).forEach(outro -> {
                outro.setPadrao(false);
                repository.save(outro);
            });
        }
        return salvo;
    }

    /** Renderiza assunto + corpo de um template substituindo as variáveis pelos dados da prospecção. */
    public RenderTemplateDTO render(UUID templateId, UUID prospecaoId) {
        TemplateEmail template = buscar(templateId);
        Prospecao prospecao = prospecaoRepository.findById(prospecaoId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Prospecção não encontrada."));
        Map<String, String> vars = montarVariaveis(prospecao);
        return new RenderTemplateDTO(
                substituir(template.getAssunto(), vars),
                substituir(template.getCorpo(), vars)
        );
    }

    /** Variáveis disponíveis nos templates (token {{chave}}). */
    public static Map<String, String> montarVariaveis(Prospecao p) {
        Map<String, String> v = new HashMap<>();
        v.put("influenciador", p.getInfluenciador() != null ? nvl(p.getInfluenciador().getNome()) : "");
        v.put("nicho", nvl(p.getNicho()));
        v.put("marca", p.getMarca() != null ? nvl(p.getMarca().getNome()) : "");
        v.put("contato", p.getContatoMarca() != null ? nvl(p.getContatoMarca().getNome()) : "");
        v.put("tipo", p.getTipo() == TipoProspecao.RECEPTIVO ? "Receptivo" : "Prospecção");
        v.put("data_contato", p.getDataContato() != null ? p.getDataContato().format(DATA_FMT) : "");
        v.put("valor_proposto", formatarValor(p.getValorProposto()));
        v.put("valor_aceito", formatarValor(p.getValorAceito()));
        v.put("valor_contraproposto", formatarValor(p.getValorContraproposto()));
        return v;
    }

    private static String substituir(String texto, Map<String, String> vars) {
        if (texto == null) return "";
        String resultado = texto;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            resultado = resultado.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return resultado;
    }

    private static String formatarValor(BigDecimal v) {
        if (v == null) return "—";
        return "R$ " + v.toPlainString().replace('.', ',');
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }
}
