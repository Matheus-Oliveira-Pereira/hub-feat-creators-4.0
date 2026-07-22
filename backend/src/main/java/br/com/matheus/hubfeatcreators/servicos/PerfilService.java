package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.entidades.Perfil;
import br.com.matheus.hubfeatcreators.enums.StatusPerfil;
import br.com.matheus.hubfeatcreators.repositorios.PerfilRepository;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.repositorios.PerfilDTORepository;
import br.com.matheus.hubfeatcreators.visoes.telas.perfil.PerfilDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PerfilService extends EntidadeService<Perfil, PerfilRepository> {

    private final PerfilDTORepository dtoRepository;

    public PaginatedResponse<PerfilDTO> listarDTO(Map<String, String[]> requestParams) {
        return dtoRepository.listar(requestParams);
    }

    public List<Perfil> listarAtivos() {
        return repository.findByStatus(StatusPerfil.ATIVO);
    }
}
