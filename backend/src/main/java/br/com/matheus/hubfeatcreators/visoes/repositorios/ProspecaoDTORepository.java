package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
import br.com.matheus.hubfeatcreators.enums.TipoProspecao;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.prospecao.ProspecaoDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
@Transactional(readOnly = true)
public class ProspecaoDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.prospecao.ProspecaoDTO(
                p.id, p.influenciador.nome, p.marca.nome, p.tipo, p.status,
                p.dataContato, p.valorAceito, p.valorProposto, p.ativo
            ) from Prospecao p where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("influenciador")) {
            builder.append(" and p.influenciador.id = :influenciadorId ");
            params.put("influenciadorId", UUID.fromString(requestParams.get("influenciador")[0]));
        }

        if (requestParams.containsKey("marca")) {
            builder.append(" and upper(p.marca.nome) like :marca ");
            params.put("marca", "%" + requestParams.get("marca")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("tipo")) {
            var tipoList = Arrays.stream(requestParams.get("tipo")[0].split(","))
                    .map(s -> TipoProspecao.valueOf(s.trim()))
                    .toList();
            builder.append(" and p.tipo in :tipoList ");
            params.put("tipoList", tipoList);
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> StatusProspecao.valueOf(s.trim()))
                    .toList();
            builder.append(" and p.status in :statusList ");
            params.put("statusList", statusList);
        }

        if (!requestParams.containsKey("mostrarInativos")) {
            builder.append(" and p.ativo = true ");
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = "%" + requestParams.get("textoDeBusca")[0].toUpperCase() + "%";
            builder.append(" and (upper(p.marca.nome) like :textoDeBusca or upper(p.influenciador.nome) like :textoDeBusca) ");
            params.put("textoDeBusca", texto);
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and p.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and p.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<ProspecaoDTO> listar(Map<String, String[]> requestParams) {
        int page = requestParams.containsKey("page") ? Integer.parseInt(requestParams.get("page")[0]) : 0;
        int size = requestParams.containsKey("size") ? Integer.parseInt(requestParams.get("size")[0]) : 10;

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.prospecao\\.ProspecaoDTO\\([^)]*\\)",
                "select count(p)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        builder.append(" order by p.registro desc ");
        var query = entityManager.createQuery(builder.toString(), ProspecaoDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        return new PaginatedResponse<>(query.getResultList(), page, size, totalElements);
    }
}
