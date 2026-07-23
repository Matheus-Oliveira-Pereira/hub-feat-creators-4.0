package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.TarefaLembreteEnviado;
import br.com.matheus.hubfeatcreators.enums.TipoLembreteTarefa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.UUID;

public interface TarefaLembreteEnviadoRepository extends JpaRepository<TarefaLembreteEnviado, UUID> {

    boolean existsByTarefaIdAndTipoAndDataReferencia(UUID tarefaId, TipoLembreteTarefa tipo, LocalDate dataReferencia);
}
