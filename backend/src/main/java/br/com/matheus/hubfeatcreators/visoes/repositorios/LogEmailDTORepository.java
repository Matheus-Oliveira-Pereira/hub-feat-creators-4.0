package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.entidades.LogEmail;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.email.LogEmailDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Repository
@Transactional(readOnly = true)
public class LogEmailDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.email.LogEmailDTO(
                l.id, l.titulo, l.destinatarios, l.copia, l.copiaOculta, l.contaNome, l.status, l.erro, l.registro, l.criadoPor
            ) from LogEmail l where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("titulo")) {
            builder.append(" and upper(l.titulo) like :titulo ");
            params.put("titulo", "%" + requestParams.get("titulo")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("destinatario")) {
            builder.append(" and upper(l.destinatarios) like :destinatario ");
            params.put("destinatario", "%" + requestParams.get("destinatario")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> LogEmail.Status.valueOf(s.trim()))
                    .toList();
            builder.append(" and l.status in :statusList ");
            params.put("statusList", statusList);
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(l.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and l.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and l.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<LogEmailDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        // Count query
        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.email\\.LogEmailDTO\\([^)]*\\)",
                "select count(l)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        // Data query
        builder.append(" order by l.registro desc ");
        var query = entityManager.createQuery(builder.toString(), LogEmailDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }
}
