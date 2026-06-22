package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends EntidadeRepository<Usuario> {

    Optional<Usuario> findByEmail(String email);
}
