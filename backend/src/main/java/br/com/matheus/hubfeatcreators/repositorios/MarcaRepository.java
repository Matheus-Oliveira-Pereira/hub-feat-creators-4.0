package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.Marca;
import br.com.matheus.hubfeatcreators.enums.StatusMarca;

import java.util.List;

public interface MarcaRepository extends EntidadeRepository<Marca> {

    List<Marca> findByStatus(StatusMarca status);
}
