package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeFinanceiro;
import br.com.matheus.hubfeatcreators.enums.StatusPagamento;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PublicidadeFinanceiroRepository extends EntidadeRepository<PublicidadeFinanceiro> {

    List<PublicidadeFinanceiro> findByStatusPagamentoNotIn(List<StatusPagamento> statusList);

    @Query("select f from PublicidadeFinanceiro f where f.statusNota = br.com.matheus.hubfeatcreators.enums.StatusNota.NAO_EMITIDA and f.publicidade.registro < :limite")
    List<PublicidadeFinanceiro> notaNaoEmitidaAntesDe(@Param("limite") LocalDateTime limite);
}
