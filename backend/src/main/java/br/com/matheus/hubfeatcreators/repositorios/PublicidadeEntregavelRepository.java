package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregavel;
import br.com.matheus.hubfeatcreators.enums.StatusEntregavel;

import java.time.LocalDate;
import java.util.List;

public interface PublicidadeEntregavelRepository extends EntidadeRepository<PublicidadeEntregavel> {

    List<PublicidadeEntregavel> findByDataEntregaBeforeAndStatusNotIn(LocalDate data, List<StatusEntregavel> statusList);
}
