package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeEntregaveisFormato;

import java.util.List;

public interface PublicidadeEntregaveisFormatoRepository extends EntidadeRepository<PublicidadeEntregaveisFormato> {

    List<PublicidadeEntregaveisFormato> findAllByOrderByDescricaoAsc();
}
