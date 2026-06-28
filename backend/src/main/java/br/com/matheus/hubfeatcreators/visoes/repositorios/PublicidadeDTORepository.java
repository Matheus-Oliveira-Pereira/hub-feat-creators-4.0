package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.StatusFinanceiro;
import br.com.matheus.hubfeatcreators.visoes.dtos.PaginatedResponse;
import br.com.matheus.hubfeatcreators.visoes.telas.publicidade.PublicidadeDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
@Transactional(readOnly = true)
public class PublicidadeDTORepository extends EntidadeDTORepository {

    private static final String HQL_LISTAR = """
            select new br.com.matheus.hubfeatcreators.visoes.telas.publicidade.PublicidadeDTO(
                p.id, p.marca.nome, p.influenciador.nome, p.parceiro,
                f.status, f.valorTotal, p.ativo
            ) from Publicidade p left join p.financeiro f where 1 = 1
            """;

    private HashMap<String, Object> consulta(Map<String, String[]> requestParams, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (requestParams.containsKey("marca")) {
            builder.append(" and upper(p.marca.nome) like :marca ");
            params.put("marca", "%" + requestParams.get("marca")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("influenciador")) {
            builder.append(" and p.influenciador.id = :influenciadorId ");
            params.put("influenciadorId", UUID.fromString(requestParams.get("influenciador")[0]));
        }

        if (requestParams.containsKey("parceiro")) {
            builder.append(" and upper(p.parceiro) like :parceiro ");
            params.put("parceiro", "%" + requestParams.get("parceiro")[0].toUpperCase() + "%");
        }

        if (requestParams.containsKey("statusFinanceiro")) {
            var statusList = Arrays.stream(requestParams.get("statusFinanceiro")[0].split(","))
                    .map(s -> StatusFinanceiro.valueOf(s.trim()))
                    .toList();
            builder.append(" and f.status in :statusList ");
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

        return params;
    }

    public PaginatedResponse<PublicidadeDTO> listar(Map<String, String[]> requestParams) {
        int page = requestParams.containsKey("page") ? Integer.parseInt(requestParams.get("page")[0]) : 0;
        int size = requestParams.containsKey("size") ? Integer.parseInt(requestParams.get("size")[0]) : 10;

        var builder = new StringBuilder(HQL_LISTAR);
        var params = consulta(requestParams, builder);

        var countHql = builder.toString().replaceFirst(
                "select new br\\.com\\.matheus\\.hubfeatcreators\\.visoes\\.telas\\.publicidade\\.PublicidadeDTO\\([^)]*\\)",
                "select count(p)"
        );
        var countQuery = entityManager.createQuery(countHql, Long.class);
        params.forEach(countQuery::setParameter);
        long totalElements = countQuery.getSingleResult();

        builder.append(" order by p.registro desc ");
        var query = entityManager.createQuery(builder.toString(), PublicidadeDTO.class);
        params.forEach(query::setParameter);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        var lista = query.getResultList();
        for (var dto : lista) {
            dto.setQtdEntregaveis(contarEntregaveis(dto.getId()));
        }

        return new PaginatedResponse<>(lista, page, size, totalElements);
    }

    private long contarEntregaveis(UUID publicidadeId) {
        return entityManager.createQuery(
                        "select count(e) from PublicidadeEntregavel e where e.publicidade.id = :id", Long.class)
                .setParameter("id", publicidadeId)
                .getSingleResult();
    }
}
