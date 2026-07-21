package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.marca.MarcaDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
@Transactional(readOnly = true)
public class MarcaDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.marca.MarcaDTO(
                m.id, m.nome, m.status
            ) from Marca m where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("nome")) {
            builder.append(" and upper(m.nome) like :nome ");
            params.put("nome", "%" + requestParams.get("nome")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> br.com.matheus.hubfeatcreators.enums.StatusMarca.valueOf(s.trim()))
                    .toList();
            builder.append(" and m.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and m.status = :statusDefault ");
            params.put("statusDefault", br.com.matheus.hubfeatcreators.enums.StatusMarca.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = requestParams.get("textoDeBusca")[0].toUpperCase();
            builder.append(" and upper(m.nome) like :textoDeBusca ");
            params.put("textoDeBusca", "%" + texto + "%");
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(m.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and m.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and m.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<MarcaDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        // Count query
        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.marca\\.MarcaDTO\\([^)]*\\)",
                "select count(m)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        // Data query
        builder.append(" order by m.nome ");
        var query = entityManager.createQuery(builder.toString(), MarcaDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();
        for (var dto : lista) {
            dto.setQtdContatos(contarContatos(dto.getId()));
        }

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }

    private long contarContatos(UUID marcaId) {
        return entityManager.createQuery(
                        "select count(c) from ContatoMarca c where c.marca.id = :id", Long.class)
                .setParameter("id", marcaId)
                .getSingleResult();
    }
}
