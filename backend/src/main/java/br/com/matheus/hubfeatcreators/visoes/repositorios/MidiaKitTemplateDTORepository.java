package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.midiakit.MidiaKitTemplateDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
@Transactional(readOnly = true)
public class MidiaKitTemplateDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.midiakit.MidiaKitTemplateDTO(
                t.id, t.nome, i.nome, t.status
            ) from MidiaKitTemplate t left join t.influenciador i where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("nome")) {
            builder.append(" and upper(t.nome) like :nome ");
            params.put("nome", "%" + requestParams.get("nome")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("influenciador")) {
            builder.append(" and upper(i.nome) like :influenciador ");
            params.put("influenciador", "%" + requestParams.get("influenciador")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> br.com.matheus.hubfeatcreators.enums.StatusMidiaKitTemplate.valueOf(s.trim()))
                    .toList();
            builder.append(" and t.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and t.status = :statusDefault ");
            params.put("statusDefault", br.com.matheus.hubfeatcreators.enums.StatusMidiaKitTemplate.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = requestParams.get("textoDeBusca")[0].toUpperCase();
            builder.append(" and (upper(t.nome) like :textoDeBusca or upper(i.nome) like :textoDeBusca) ");
            params.put("textoDeBusca", "%" + texto + "%");
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(t.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and t.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and t.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<MidiaKitTemplateDTO> listar(Map<String, String[]> requestParams) {
        int page = requestParams.containsKey("page") ? Integer.parseInt(requestParams.get("page")[0]) : 0;
        int size = requestParams.containsKey("size") ? Integer.parseInt(requestParams.get("size")[0]) : 10;

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        // Count query
        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.midiakit\\.MidiaKitTemplateDTO\\([^)]*\\)",
                "select count(t)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        // Data query
        builder.append(" order by t.nome ");
        var query = entityManager.createQuery(builder.toString(), MidiaKitTemplateDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();
        for (var dto : lista) {
            dto.setQtdSessoes(contarSessoes(dto.getId()));
        }

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }

    private long contarSessoes(UUID templateId) {
        return entityManager.createQuery(
                        "select count(s) from SessaoMidiaKit s where s.template.id = :id", Long.class)
                .setParameter("id", templateId)
                .getSingleResult();
    }
}
