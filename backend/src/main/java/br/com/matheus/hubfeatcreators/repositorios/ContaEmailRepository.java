package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.ContaEmail;
import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContaEmailRepository extends EntidadeRepository<ContaEmail> {

    List<ContaEmail> findByStatus(StatusContaEmail status);

    Optional<ContaEmail> findFirstBySistemaTrueAndStatus(StatusContaEmail status);

    List<ContaEmail> findBySistemaTrueAndIdNot(UUID id);

    List<ContaEmail> findBySistemaTrue();
}
