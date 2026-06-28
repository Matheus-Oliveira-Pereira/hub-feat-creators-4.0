package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Prospecao;

import java.util.List;
import java.util.UUID;

public interface ProspecaoRepository extends EntidadeRepository<Prospecao> {

    List<Prospecao> findByInfluenciadorIdAndAtivoTrueOrderByRegistroAsc(UUID influenciadorId);
}
