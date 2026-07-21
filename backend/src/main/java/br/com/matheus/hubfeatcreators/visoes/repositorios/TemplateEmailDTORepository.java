package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.StatusTemplateEmail;
import br.com.matheus.hubfeatcreators.enums.TipoTemplateEmail;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.templateemail.TemplateEmailDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Repository
@Transactional(readOnly = true)
public class TemplateEmailDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.templateemail.TemplateEmailDTO(
                t.id, t.nome, t.tipo, t.assunto, t.padrao, t.status
            ) from TemplateEmail t where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("nome")) {
            builder.append(" and upper(t.nome) like :nome ");
            params.put("nome", "%" + requestParams.get("nome")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("tipo")) {
            var tipoList = Arrays.stream(requestParams.get("tipo")[0].split(","))
                    .map(s -> TipoTemplateEmail.valueOf(s.trim()))
                    .toList();
            builder.append(" and t.tipo in :tipoList ");
            params.put("tipoList", tipoList);
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> StatusTemplateEmail.valueOf(s.trim()))
                    .toList();
            builder.append(" and t.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and t.status = :statusDefault ");
            params.put("statusDefault", StatusTemplateEmail.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = "%" + requestParams.get("textoDeBusca")[0].toUpperCase() + "%";
            builder.append(" and (upper(t.nome) like :textoDeBusca or upper(t.assunto) like :textoDeBusca) ");
            params.put("textoDeBusca", texto);
        }

        return params;
    }

    public PaginatedResponse<TemplateEmailDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.templateemail\\.TemplateEmailDTO\\([^)]*\\)",
                "select count(t)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        builder.append(" order by t.tipo, t.nome ");
        var query = entityManager.createQuery(builder.toString(), TemplateEmailDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        return new PaginatedResponse<>(query.getResultList(), page, size, totalElements);
    }
}
