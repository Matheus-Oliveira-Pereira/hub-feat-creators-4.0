package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.StatusNota;
import br.com.matheus.hubfeatcreators.enums.StatusPagamento;
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
                f.statusNota, f.statusPagamento, f.moeda, f.valorTotal,
                f.dataPrevistaRecebimento, p.registro, p.ativo
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

        if (requestParams.containsKey("statusNota")) {
            var notaList = Arrays.stream(requestParams.get("statusNota")[0].split(","))
                    .map(s -> StatusNota.valueOf(s.trim()))
                    .toList();
            builder.append(" and f.statusNota in :notaList ");
            params.put("notaList", notaList);
        }

        if (requestParams.containsKey("statusPagamento")) {
            var pagamentoList = Arrays.stream(requestParams.get("statusPagamento")[0].split(","))
                    .map(s -> StatusPagamento.valueOf(s.trim()))
                    .toList();
            builder.append(" and f.statusPagamento in :pagamentoList ");
            params.put("pagamentoList", pagamentoList);
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
        int page = parsePage(requestParams);
        int size = parseSize(requestParams);

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
