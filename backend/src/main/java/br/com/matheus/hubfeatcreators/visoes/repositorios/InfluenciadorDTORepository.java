package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.influenciador.InfluenciadorDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Repository
@Transactional(readOnly = true)
public class InfluenciadorDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.influenciador.InfluenciadorDTO(
                i.id, i.nome, i.email, i.telefone, i.instagram, i.status
            ) from Influenciador i where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("nome")) {
            builder.append(" and upper(i.nome) like :nome ");
            params.put("nome", "%" + requestParams.get("nome")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("email")) {
            builder.append(" and upper(i.email) like :email ");
            params.put("email", "%" + requestParams.get("email")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("instagram")) {
            builder.append(" and upper(i.instagram) like :instagram ");
            params.put("instagram", "%" + requestParams.get("instagram")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> br.com.matheus.hubfeatcreators.enums.StatusInfluenciador.valueOf(s.trim()))
                    .toList();
            builder.append(" and i.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and i.status = :statusDefault ");
            params.put("statusDefault", br.com.matheus.hubfeatcreators.enums.StatusInfluenciador.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = requestParams.get("textoDeBusca")[0].toUpperCase();
            builder.append(" and (upper(i.nome) like :textoDeBusca or upper(i.email) like :textoDeBusca or upper(i.instagram) like :textoDeBusca) ");
            params.put("textoDeBusca", "%" + texto + "%");
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(i.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and i.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and i.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<InfluenciadorDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        // Count query
        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.influenciador\\.InfluenciadorDTO\\([^)]*\\)",
                "select count(i)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        // Data query
        builder.append(" order by i.nome ");
        var query = entityManager.createQuery(builder.toString(), InfluenciadorDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }
}
