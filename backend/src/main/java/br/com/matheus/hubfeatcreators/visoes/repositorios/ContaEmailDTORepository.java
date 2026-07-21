package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.StatusContaEmail;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.contaemail.ContaEmailDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Repository
@Transactional(readOnly = true)
public class ContaEmailDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.contaemail.ContaEmailDTO(
                c.id, c.nome, c.usuario, c.host, c.porta, c.sistema, c.status
            ) from ContaEmail c where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("nome")) {
            builder.append(" and upper(c.nome) like :nome ");
            params.put("nome", "%" + requestParams.get("nome")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("usuario")) {
            builder.append(" and upper(c.usuario) like :usuario ");
            params.put("usuario", "%" + requestParams.get("usuario")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> StatusContaEmail.valueOf(s.trim()))
                    .toList();
            builder.append(" and c.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and c.status = :statusDefault ");
            params.put("statusDefault", StatusContaEmail.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = requestParams.get("textoDeBusca")[0].toUpperCase();
            builder.append(" and (upper(c.nome) like :textoDeBusca or upper(c.usuario) like :textoDeBusca or upper(c.host) like :textoDeBusca) ");
            params.put("textoDeBusca", "%" + texto + "%");
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(c.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and c.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and c.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<ContaEmailDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.contaemail\\.ContaEmailDTO\\([^)]*\\)",
                "select count(c)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        builder.append(" order by c.nome ");
        var query = entityManager.createQuery(builder.toString(), ContaEmailDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }
}
