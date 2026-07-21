package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.usuario.UsuarioDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional(readOnly = true)
public class UsuarioDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.usuario.UsuarioDTO(
                u.id, u.nome, u.email, u.status
            ) from Usuario u where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("nome")) {
            builder.append(" and upper(u.nome) like :nome ");
            params.put("nome", "%" + requestParams.get("nome")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("email")) {
            builder.append(" and upper(u.email) like :email ");
            params.put("email", "%" + requestParams.get("email")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> br.com.matheus.hubfeatcreators.enums.StatusUsuario.valueOf(s.trim()))
                    .toList();
            builder.append(" and u.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and u.status = :statusDefault ");
            params.put("statusDefault", br.com.matheus.hubfeatcreators.enums.StatusUsuario.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = requestParams.get("textoDeBusca")[0].toUpperCase();
            builder.append(" and (upper(u.nome) like :textoDeBusca or upper(u.email) like :textoDeBusca) ");
            params.put("textoDeBusca", "%" + texto + "%");
        }

        if (requestParams.containsKey("perfil")) {
            var perfilList = Arrays.stream(requestParams.get("perfil")[0].split(","))
                    .map(s -> s.trim().toUpperCase())
                    .toList();
            builder.append(" and exists (select 1 from u.perfis p where upper(p.descricao) in :perfilList) ");
            params.put("perfilList", perfilList);
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(u.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("registroDe")) {
            builder.append(" and u.registro >= :registroDe ");
            params.put("registroDe", LocalDate.parse(requestParams.get("registroDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("registroAte")) {
            builder.append(" and u.registro <= :registroAte ");
            params.put("registroAte", LocalDate.parse(requestParams.get("registroAte")[0]).atTime(23, 59, 59));
        }

        if (requestParams.containsKey("modificacaoDe")) {
            builder.append(" and u.ultimaModificacao >= :modificacaoDe ");
            params.put("modificacaoDe", LocalDate.parse(requestParams.get("modificacaoDe")[0]).atStartOfDay());
        }

        if (requestParams.containsKey("modificacaoAte")) {
            builder.append(" and u.ultimaModificacao <= :modificacaoAte ");
            params.put("modificacaoAte", LocalDate.parse(requestParams.get("modificacaoAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    public PaginatedResponse<UsuarioDTO> listar(Map<String, String[]> requestParams) {
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        // Count query
        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.usuario\\.UsuarioDTO\\([^)]*\\)",
                "select count(u)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        // Data query
        builder.append(" order by u.nome ");
        var query = entityManager.createQuery(builder.toString(), UsuarioDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();

        var perfisPorUsuario = buscarPerfisPorUsuario(lista.stream().map(UsuarioDTO::getId).toList());
        lista.forEach(u -> u.setPerfis(perfisPorUsuario.getOrDefault(u.getId(), "")));

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }

    private Map<UUID, String> buscarPerfisPorUsuario(List<UUID> ids) {
        if (ids.isEmpty()) return Map.of();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createQuery(
                "select u.id, p.descricao from Usuario u join u.perfis p where u.id in :ids order by p.descricao"
        ).setParameter("ids", ids).getResultList();

        return rows.stream().collect(Collectors.groupingBy(
                r -> (UUID) r[0],
                Collectors.mapping(r -> (String) r[1], Collectors.joining(", "))
        ));
    }
}
