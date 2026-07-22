package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.enums.StatusInfluenciador;
import br.com.matheus.hubfeatcreators.repositorios.ContaEmailRepository;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.exceptions.EntidadeNaoEncontradaException;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.InfluenciadorDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.influenciador.InfluenciadorDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InfluenciadorService extends EntidadeService<Influenciador, InfluenciadorRepository> {

    private final InfluenciadorDTORepository dtoRepository;

    private final ContaEmailRepository contaEmailRepository;

    public PaginatedResponse<InfluenciadorDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<Influenciador> listarAtivos() {
        return repository.findByStatus(StatusInfluenciador.ATIVO);
    }

    @Override
    @Transactional
    public Influenciador salvar(Influenciador entidade) {
        // Campos de rede social são únicos: normaliza vazio para null
        // (evita colisão de unicidade entre múltiplos registros sem rede social).
        entidade.setTelefone(normalizar(entidade.getTelefone()));
        entidade.setInstagram(normalizar(entidade.getInstagram()));
        entidade.setTiktok(normalizar(entidade.getTiktok()));
        entidade.setLinkedin(normalizar(entidade.getLinkedin()));
        entidade.setYoutube(normalizar(entidade.getYoutube()));
        entidade.setDiscord(normalizar(entidade.getDiscord()));
        resolverContaEmail(entidade);
        return super.salvar(entidade);
    }

    /** Substitui a conta de e-mail enviada como {id} pela entidade gerenciada (evita erro de versão em entidade detached). */
    private void resolverContaEmail(Influenciador entidade) {
        if (entidade.getContaEmail() != null && entidade.getContaEmail().getId() != null) {
            ContaEmail conta = contaEmailRepository.findById(entidade.getContaEmail().getId())
                    .orElseThrow(() -> new EntidadeNaoEncontradaException("Conta de e-mail não encontrada."));
            entidade.setContaEmail(conta);
        } else {
            entidade.setContaEmail(null);
        }
    }

    private String normalizar(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }
}
