package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Perfil;
import br.com.matheus.hubfeatcreators.enums.StatusPerfil;

import java.util.List;
import java.util.Optional;

public interface PerfilRepository extends EntidadeRepository<Perfil> {

    Optional<Perfil> findByDescricao(String descricao);

    List<Perfil> findByStatus(StatusPerfil status);
}
