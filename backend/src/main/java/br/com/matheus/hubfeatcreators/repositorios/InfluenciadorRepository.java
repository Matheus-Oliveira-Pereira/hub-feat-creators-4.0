package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Influenciador;
import br.com.matheus.hubfeatcreators.enums.StatusInfluenciador;

import java.util.List;

public interface InfluenciadorRepository extends EntidadeRepository<Influenciador> {

    List<Influenciador> findByStatus(StatusInfluenciador status);
}
