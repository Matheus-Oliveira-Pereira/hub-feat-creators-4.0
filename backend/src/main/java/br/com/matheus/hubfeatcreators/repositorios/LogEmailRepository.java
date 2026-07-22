package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LogEmailRepository extends EntidadeRepository<LogEmail> {

    /** Logs com falha ainda dentro do limite de tentativas (base do auto-retry agendado). */
    List<LogEmail> findByStatusAndTentativasLessThan(LogEmail.Status status, int maxTentativas);

    /** Logs de um e-mail específico (usado pelo rastreio de abertura via pixel). */
    List<LogEmail> findByEmailId(UUID emailId);
}
