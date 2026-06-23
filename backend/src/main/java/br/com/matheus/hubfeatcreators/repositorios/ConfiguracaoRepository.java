package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Configuracao;

import java.util.Optional;

public interface ConfiguracaoRepository extends EntidadeRepository<Configuracao> {

    Optional<Configuracao> findFirstByOrderByRegistroAsc();
}
