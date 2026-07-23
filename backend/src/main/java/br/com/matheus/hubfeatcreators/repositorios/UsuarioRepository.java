package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Usuario;
import br.com.matheus.hubfeatcreators.enums.StatusUsuario;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends EntidadeRepository<Usuario> {

    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByStatus(StatusUsuario status);
}
