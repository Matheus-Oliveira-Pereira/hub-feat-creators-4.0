package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.PrioridadeTarefa;
import br.com.matheus.hubfeatcreators.enums.StatusTarefa;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.tarefa.TarefaDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
@Transactional(readOnly = true)
public class TarefaDTORepository extends EntidadeDTORepository {

    /**
     * Left joins explícitos: todas as associações são opcionais — path implícito geraria
     * inner join e sumiria com tarefas sem vínculo.
     */
    private static final String HQL_FROM = """
            from Tarefa t
            left join t.usuarioResponsavel ur
            left join t.influenciadorResponsavel ir
            left join t.influenciador i
            left join t.marca m
            where 1 = 1
            """;

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.tarefa.TarefaDTO(
                t.id, t.titulo, t.status, t.prioridade, t.tipoResponsavel,
                ur.nome, ir.nome, i.nome, m.nome,
                t.dataInicio, t.previsaoExecucao, t.previsaoTermino, t.dataConclusao,
                t.notificacaoAutomatica, t.recorrencia,
                (select count(c) from TarefaChecklistItem c where c.tarefa = t),
                (select count(c2) from TarefaChecklistItem c2 where c2.tarefa = t and c2.concluido = true),
                t.ativo
            )
            """ + HQL_FROM;

    /** Count separado: o replace por regex do padrão dos outros repositórios quebra com as subqueries do construtor. */
    private static final String HQL_CONTAR = "select count(t) " + HQL_FROM;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> StatusTarefa.valueOf(s.trim()))
                    .toList();
            builder.append(" and t.status in :statusList ");
            params.put("statusList", statusList);
        }

        if (requestParams.containsKey("prioridade")) {
            var prioridadeList = Arrays.stream(requestParams.get("prioridade")[0].split(","))
                    .map(s -> PrioridadeTarefa.valueOf(s.trim()))
                    .toList();
            builder.append(" and t.prioridade in :prioridadeList ");
            params.put("prioridadeList", prioridadeList);
        }

        if (requestParams.containsKey("usuarioResponsavel")) {
            builder.append(" and ur.id = :usuarioResponsavelId ");
            params.put("usuarioResponsavelId", UUID.fromString(requestParams.get("usuarioResponsavel")[0]));
        }

        if (requestParams.containsKey("influenciadorResponsavel")) {
            builder.append(" and ir.id = :influenciadorResponsavelId ");
            params.put("influenciadorResponsavelId", UUID.fromString(requestParams.get("influenciadorResponsavel")[0]));
        }

        if (requestParams.containsKey("influenciador")) {
            builder.append(" and i.id = :influenciadorId ");
            params.put("influenciadorId", UUID.fromString(requestParams.get("influenciador")[0]));
        }

        if (requestParams.containsKey("marca")) {
            builder.append(" and upper(m.nome) like :marca ");
            params.put("marca", "%" + requestParams.get("marca")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("previsaoDe")) {
            builder.append(" and t.previsaoTermino >= :previsaoDe ");
            params.put("previsaoDe", LocalDate.parse(requestParams.get("previsaoDe")[0]));
        }

        if (requestParams.containsKey("previsaoAte")) {
            builder.append(" and t.previsaoTermino <= :previsaoAte ");
            params.put("previsaoAte", LocalDate.parse(requestParams.get("previsaoAte")[0]));
        }

        if (requestParams.containsKey("atrasadas")) {
            builder.append(" and t.previsaoTermino < current_date and t.status not in :statusFinalizados ");
            params.put("statusFinalizados", Arrays.asList(StatusTarefa.CONCLUIDA, StatusTarefa.CANCELADA));
        }

        if (requestParams.containsKey("recorrentes")) {
            builder.append(" and t.recorrencia is not null ");
        }

        if (!requestParams.containsKey("mostrarInativos")) {
            builder.append(" and t.ativo = true ");
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = "%" + requestParams.get("textoDeBusca")[0].toUpperCase() + "%";
            builder.append(" and (upper(t.titulo) like :textoDeBusca or upper(ur.nome) like :textoDeBusca")
                    .append(" or upper(ir.nome) like :textoDeBusca or upper(i.nome) like :textoDeBusca")
                    .append(" or upper(m.nome) like :textoDeBusca) ");
            params.put("textoDeBusca", texto);
        }

        return params;
    }

    public PaginatedResponse<TarefaDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        // Kanban e agenda buscam o quadro/período inteiro numa página só — teto maior que o padrão (100).
        int size = parseInteiro(requestParams, "size", 10, 1000);

        var filtros = new StringBuilder();
        var params = consulta(requestParams, filtros);

        var countQuery = entityManager.createQuery(HQL_CONTAR + filtros, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        var query = entityManager.createQuery(
                HQL_LISTAR + filtros + " order by t.registro desc ", TarefaDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        return new PaginatedResponse<>(query.getResultList(), page, size, totalElements);
    }
}
