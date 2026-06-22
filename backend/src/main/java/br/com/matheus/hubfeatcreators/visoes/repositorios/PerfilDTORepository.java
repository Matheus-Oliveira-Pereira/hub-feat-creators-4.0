package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.Role;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.perfil.PerfilDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional(readOnly = true)
public class PerfilDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.perfil.PerfilDTO(
                p.id, p.descricao, p.status
            ) from Perfil p where 1 = 1
            """;

    private static final String HQL_CONTAR_ROLE = """
            select count(r)
            from Perfil p join p.roles r
            where p.id = :id and r in :roles
            """;

    private static final Set<Role> ROLES_A = Arrays.stream(Role.values())
            .filter(r -> r.name().endsWith("A")).collect(Collectors.toSet());

    private static final Set<Role> ROLES_B = Arrays.stream(Role.values())
            .filter(r -> r.name().endsWith("B")).collect(Collectors.toSet());

    private static final Set<Role> ROLES_C = Arrays.stream(Role.values())
            .filter(r -> r.name().endsWith("C")).collect(Collectors.toSet());

    private static final Set<Role> ROLES_D = Arrays.stream(Role.values())
            .filter(r -> r.name().endsWith("D")).collect(Collectors.toSet());

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("descricao")) {
            builder.append(" and upper(p.descricao) like :descricao ");
            params.put("descricao", "%" + requestParams.get("descricao")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("status")) {
            var statusList = Arrays.stream(requestParams.get("status")[0].split(","))
                    .map(s -> br.com.matheus.hubfeatcreators.enums.StatusPerfil.valueOf(s.trim()))
                    .toList();
            builder.append(" and p.status in :statusList ");
            params.put("statusList", statusList);
        } else {
            builder.append(" and p.status = :statusDefault ");
            params.put("statusDefault", br.com.matheus.hubfeatcreators.enums.StatusPerfil.ATIVO);
        }

        if (requestParams.containsKey("textoDeBusca")) {
            var texto = requestParams.get("textoDeBusca")[0].toUpperCase();
            builder.append(" and upper(p.descricao) like :textoDeBusca ");
            params.put("textoDeBusca", "%" + texto + "%");
        }

        if (requestParams.containsKey("role")) {
            var roleList = Arrays.stream(requestParams.get("role")[0].split(","))
                    .map(s -> Role.valueOf(s.trim()))
                    .toList();
            builder.append(" and exists (select 1 from Perfil p2 join p2.roles r where p2.id = p.id and r in :roleList) ");
            params.put("roleList", roleList);
        }

        if (requestParams.containsKey("criadoPor")) {
            builder.append(" and upper(p.criadoPor) like :criadoPor ");
            params.put("criadoPor", "%" + requestParams.get("criadoPor")[0].toUpperCase() + "%");
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

    public PaginatedResponse<PerfilDTO> listar(Map<String, String[]> requestParams) {
        int page = requestParams.containsKey("page") ? Integer.parseInt(requestParams.get("page")[0]) : 0;
        int size = requestParams.containsKey("size") ? Integer.parseInt(requestParams.get("size")[0]) : 10;

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        // Count query
        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.perfil\\.PerfilDTO\\([^)]*\\)",
                "select count(p)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        // Data query
        builder.append(" order by p.descricao ");
        var query = entityManager.createQuery(builder.toString(), PerfilDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();
        var ids = lista.stream().map(PerfilDTO::getId).toList();
        var rolesPorPerfil = buscarRolesPorPerfil(ids);
        for (var perfil : lista) {
            perfil.setRoles(rolesPorPerfil.getOrDefault(perfil.getId(), List.of()));
            perfil.setTotalA(contarRolesPorTipo(perfil.getId(), ROLES_A));
            perfil.setTotalB(contarRolesPorTipo(perfil.getId(), ROLES_B));
            perfil.setTotalC(contarRolesPorTipo(perfil.getId(), ROLES_C));
            perfil.setTotalD(contarRolesPorTipo(perfil.getId(), ROLES_D));
        }

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }

    private Map<UUID, List<String>> buscarRolesPorPerfil(List<UUID> ids) {
        if (ids.isEmpty()) return Map.of();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createQuery(
                "select p.id, r from Perfil p join p.roles r where p.id in :ids order by r"
        ).setParameter("ids", ids).getResultList();

        return rows.stream().collect(Collectors.groupingBy(
                r -> (UUID) r[0],
                Collectors.mapping(r -> ((Role) r[1]).name(), Collectors.toList())
        ));
    }

    private int contarRolesPorTipo(UUID perfilId, Set<Role> roles) {
        return entityManager.createQuery(HQL_CONTAR_ROLE, Long.class)
                .setParameter("id", perfilId)
                .setParameter("roles", roles)
                .getSingleResult()
                .intValue();
    }
}
