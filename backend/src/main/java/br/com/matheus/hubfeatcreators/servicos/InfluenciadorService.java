package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.repositorios.InfluenciadorRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.InfluenciadorDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.influenciador.InfluenciadorDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class InfluenciadorService extends EntidadeService<Influenciador, InfluenciadorRepository> {

    @Autowired
    private InfluenciadorDTORepository dtoRepository;

    public PaginatedResponse<InfluenciadorDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    @Override
    public Influenciador salvar(Influenciador entidade) {
        // Campos de rede social são únicos: normaliza vazio para null
        // (evita colisão de unicidade entre múltiplos registros sem rede social).
        entidade.setTelefone(normalizar(entidade.getTelefone()));
        entidade.setInstagram(normalizar(entidade.getInstagram()));
        entidade.setTiktok(normalizar(entidade.getTiktok()));
        entidade.setLinkedin(normalizar(entidade.getLinkedin()));
        entidade.setYoutube(normalizar(entidade.getYoutube()));
        return super.salvar(entidade);
    }

    private String normalizar(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }
}
