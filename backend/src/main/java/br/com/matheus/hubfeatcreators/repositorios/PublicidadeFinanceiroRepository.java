package br.com.matheus.hubfeatcreators.repositorios;

import br.com.matheus.hubfeatcreators.entidades.PublicidadeFinanceiro;
import br.com.matheus.hubfeatcreators.enums.StatusFinanceiro;

import java.time.LocalDate;
import java.util.List;

public interface PublicidadeFinanceiroRepository extends EntidadeRepository<PublicidadeFinanceiro> {

    List<PublicidadeFinanceiro> findByDataPrevistaRecebimentoBeforeAndStatusNotIn(LocalDate data, List<StatusFinanceiro> statusList);
}
