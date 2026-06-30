package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.entidades.Marca;
import br.com.matheus.hubfeatcreators.entidades.Prospecao;
import br.com.matheus.hubfeatcreators.entidades.Publicidade;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregavel;
import br.com.matheus.hubfeatcreators.entidades.PublicidadeFinanceiro;
import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.repositorios.MarcaRepository;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeEntregaveisFormatoRepository;
import br.com.matheus.hubfeatcreators.repositorios.PublicidadeRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.PublicidadeDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.publicidade.PublicidadeDTO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Map;

@Service
public class PublicidadeService extends EntidadeService<Publicidade, PublicidadeRepository> {

    @Autowired
    private PublicidadeDTORepository dtoRepository;

    @Autowired
    private ProspecaoService prospecaoService;

    @Autowired
    private InfluenciadorRepository influenciadorRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private PublicidadeEntregaveisFormatoRepository formatoRepository;

    public PaginatedResponse<PublicidadeDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    @Override
    @Transactional
    public Publicidade salvar(Publicidade entidade) {
        if (entidade.getPorcentagemAssessora() == null) {
            entidade.setPorcentagemAssessora(new BigDecimal("20"));
        }
        resolverReferencias(entidade);
        sincronizarFilhos(entidade);
        calcularSplit(entidade);
        Publicidade salvo = super.salvar(entidade);
        marcarProspecaoFechada(salvo);
        return salvo;
    }

    /** Substitui referências enviadas como {id} por entidades gerenciadas (evita erro de versão em entidade detached). */
    private void resolverReferencias(Publicidade p) {
        if (p.getInfluenciador() != null && p.getInfluenciador().getId() != null) {
            Influenciador influ = influenciadorRepository.findById(p.getInfluenciador().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Influenciador não encontrado."));
            p.setInfluenciador(influ);
        }
        if (p.getMarca() != null && p.getMarca().getId() != null) {
            Marca marca = marcaRepository.findById(p.getMarca().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Marca não encontrada."));
            p.setMarca(marca);
        }
        if (p.getProspecao() != null && p.getProspecao().getId() != null) {
            p.setProspecao(prospecaoService.buscar(p.getProspecao().getId()));
        }
        if (p.getEntregaveis() != null) {
            for (PublicidadeEntregavel e : p.getEntregaveis()) {
                if (e.getFormato() != null && e.getFormato().getId() != null) {
                    PublicidadeEntregaveisFormato formato = formatoRepository.findById(e.getFormato().getId())
                            .orElseThrow(() -> new EntidadeNaoEncontradaException("Formato de entregável não encontrado."));
                    e.setFormato(formato);
                }
            }
        }
    }

    /** Recria filhos (financeiro + entregáveis) na atualização; preserva o vínculo de prospecção. */
    @Override
    public void copyProperties(Publicidade source, Publicidade target) {
        BeanUtils.copyProperties(source, target,
                "id", "versao", "registro", "criadoPor", "financeiro", "entregaveis", "prospecao");

        target.setFinanceiro(null);
        if (source.getFinanceiro() != null) {
            PublicidadeFinanceiro f = source.getFinanceiro();
            f.setId(null);
            target.setFinanceiro(f);
        }

        target.getEntregaveis().clear();
        if (source.getEntregaveis() != null) {
            for (PublicidadeEntregavel e : source.getEntregaveis()) {
                e.setId(null);
                target.getEntregaveis().add(e);
            }
        }
    }

    /** Garante back-refs dos filhos para o pai (necessário p/ orphanRemoval e FKs). */
    private void sincronizarFilhos(Publicidade p) {
        if (p.getEntregaveis() == null) {
            p.setEntregaveis(new ArrayList<>());
        }
        p.getEntregaveis().forEach(e -> e.setPublicidade(p));
        if (p.getFinanceiro() != null) {
            p.getFinanceiro().setPublicidade(p);
        }
    }

    /** valorAssessora = valorTotal × %; valorInfluenciador = resto. Só calcula o que vier nulo (override manual). */
    private void calcularSplit(Publicidade p) {
        PublicidadeFinanceiro f = p.getFinanceiro();
        if (f == null || f.getValorTotal() == null) {
            return;
        }
        BigDecimal pct = p.getPorcentagemAssessora() != null ? p.getPorcentagemAssessora() : new BigDecimal("20");
        if (f.getValorAssessora() == null) {
            f.setValorAssessora(f.getValorTotal().multiply(pct)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        if (f.getValorInfluenciador() == null) {
            BigDecimal ass = f.getValorAssessora() != null ? f.getValorAssessora() : BigDecimal.ZERO;
            f.setValorInfluenciador(f.getValorTotal().subtract(ass));
        }
    }

    private void marcarProspecaoFechada(Publicidade p) {
        if (p.getProspecao() == null) {
            return;
        }
        Prospecao prospecao = prospecaoService.buscar(p.getProspecao().getId());
        boolean mudou = false;
        if (prospecao.getStatus() != StatusProspecao.PUBLICIDADE_FECHADA) {
            prospecao.setStatus(StatusProspecao.PUBLICIDADE_FECHADA);
            mudou = true;
        }
        if (!p.getId().equals(prospecao.getPublicidadeId())) {
            prospecao.setPublicidadeId(p.getId());
            mudou = true;
        }
        if (mudou) {
            prospecaoService.salvar(prospecao);
        }
    }
}
