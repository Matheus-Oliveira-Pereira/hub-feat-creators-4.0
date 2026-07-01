package br.com.matheus.hubfeatcreators.visoes.repositorios;

import br.com.matheus.hubfeatcreators.enums.StatusNota;
import br.com.matheus.hubfeatcreators.enums.StatusPagamento;
import br.com.matheus.hubfeatcreators.enums.StatusProspecao;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.DistribuicaoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.MetricasResumoDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.RankingItemDTO;
import br.com.matheus.hubfeatcreators.visoes.dtos.metricas.SerieTemporalDTO;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@Transactional(readOnly = true)
public class MetricasRepository extends EntidadeDTORepository {

    /**
     * Monta filtros comuns sobre uma raiz que tenha os caminhos {@code <alias>.influenciador},
     * {@code <alias>.marca} e {@code <alias>.registro}. Vale para Publicidade e Prospecao.
     */
    private Map<String, Object> filtros(Map<String, String[]> req, String alias, StringBuilder builder) {
        var params = new HashMap<String, Object>();

        if (req.containsKey("influenciador")) {
            var ids = Arrays.stream(req.get("influenciador")[0].split(","))
                    .map(String::trim).map(UUID::fromString).toList();
            builder.append(" and ").append(alias).append(".influenciador.id in :influenciadorIds ");
            params.put("influenciadorIds", ids);
        }

        if (req.containsKey("marca")) {
            var ids = Arrays.stream(req.get("marca")[0].split(","))
                    .map(String::trim).map(UUID::fromString).toList();
            builder.append(" and ").append(alias).append(".marca.id in :marcaIds ");
            params.put("marcaIds", ids);
        }

        if (req.containsKey("dataDe")) {
            builder.append(" and ").append(alias).append(".registro >= :dataDe ");
            params.put("dataDe", LocalDate.parse(req.get("dataDe")[0]).atStartOfDay());
        }

        if (req.containsKey("dataAte")) {
            builder.append(" and ").append(alias).append(".registro <= :dataAte ");
            params.put("dataAte", LocalDate.parse(req.get("dataAte")[0]).atTime(23, 59, 59));
        }

        return params;
    }

    private static BigDecimal big(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal b) return b;
        return new BigDecimal(o.toString());
    }

    private static long lng(Object o) {
        return o == null ? 0L : ((Number) o).longValue();
    }

    // ---------------------------------------------------------------- resumo

    public MetricasResumoDTO resumo(Map<String, String[]> req) {
        // Financeiro — left join para incluir deals sem financeiro nos totais
        var fb = new StringBuilder("""
                select
                    coalesce(sum(f.valorTotal), 0),
                    coalesce(sum(f.valorAssessora), 0),
                    coalesce(sum(f.valorInfluenciador), 0),
                    coalesce(sum(case when f.statusPagamento = :recebido then f.valorTotal else 0 end), 0),
                    coalesce(sum(case when f.statusPagamento = :pendente then f.valorTotal else 0 end), 0),
                    coalesce(sum(case when f.statusPagamento = :atrasado then f.valorTotal else 0 end), 0),
                    sum(case when f.statusPagamento = :recebido then 1 else 0 end),
                    sum(case when f.statusPagamento = :pendente then 1 else 0 end),
                    sum(case when f.statusPagamento = :atrasado then 1 else 0 end),
                    sum(case when f.statusNota <> :naoEmitida and f.statusNota is not null then 1 else 0 end),
                    coalesce(avg(f.valorTotal), 0),
                    count(p.id)
                from Publicidade p left join p.financeiro f
                where p.ativo = true
                """);
        var fp = filtros(req, "p", fb);
        var fq = entityManager.createQuery(fb.toString());
        fq.setParameter("recebido", StatusPagamento.RECEBIDO);
        fq.setParameter("pendente", StatusPagamento.PENDENTE);
        fq.setParameter("atrasado", StatusPagamento.ATRASADO);
        fq.setParameter("naoEmitida", StatusNota.NAO_EMITIDA);
        fp.forEach(fq::setParameter);
        var f = (Object[]) fq.getSingleResult();

        // Pipeline
        var pb = new StringBuilder("""
                select
                    count(p.id),
                    sum(case when p.status = :fechada then 1 else 0 end),
                    sum(case when p.status = :encerrada then 1 else 0 end),
                    coalesce(sum(case when p.status not in (:fechada, :encerrada) then p.valorProposto else 0 end), 0),
                    coalesce(sum(case when p.status = :fechada then p.valorAceito else 0 end), 0)
                from Prospecao p
                where p.ativo = true
                """);
        var pp = filtros(req, "p", pb);
        var pq = entityManager.createQuery(pb.toString());
        pq.setParameter("fechada", StatusProspecao.PUBLICIDADE_FECHADA);
        pq.setParameter("encerrada", StatusProspecao.ENCERRADO);
        pp.forEach(pq::setParameter);
        var pr = (Object[]) pq.getSingleResult();

        long totalProspecoes = lng(pr[0]);
        long fechadas = lng(pr[1]);
        long encerradas = lng(pr[2]);
        long emAndamento = totalProspecoes - fechadas - encerradas;
        double taxaConversao = totalProspecoes == 0 ? 0d
                : Math.round((fechadas * 10000d) / totalProspecoes) / 100d;

        return new MetricasResumoDTO(
                big(f[0]), big(f[1]), big(f[2]),
                big(f[3]), big(f[4]), big(f[5]),
                lng(f[6]), lng(f[7]), lng(f[8]),
                lng(f[9]), big(f[10]), lng(f[11]),
                totalProspecoes, fechadas, encerradas, emAndamento,
                taxaConversao, big(pr[3]), big(pr[4])
        );
    }

    // -------------------------------------------------------- faturamento mensal

    public List<SerieTemporalDTO> faturamentoMensal(Map<String, String[]> req) {
        var b = new StringBuilder("""
                select year(f.dataEnvioNota), month(f.dataEnvioNota),
                       coalesce(sum(f.valorTotal), 0), count(f.id)
                from Publicidade p join p.financeiro f
                where p.ativo = true and f.dataEnvioNota is not null
                """);
        var params = filtros(req, "p", b);
        b.append(" group by year(f.dataEnvioNota), month(f.dataEnvioNota) ");
        b.append(" order by year(f.dataEnvioNota), month(f.dataEnvioNota) ");

        var q = entityManager.createQuery(b.toString());
        params.forEach(q::setParameter);

        var resultado = new ArrayList<SerieTemporalDTO>();
        for (var row : q.getResultList()) {
            var r = (Object[]) row;
            var label = String.format("%04d-%02d", lng(r[0]), lng(r[1]));
            resultado.add(new SerieTemporalDTO(label, big(r[2]), lng(r[3])));
        }
        return resultado;
    }

    // ------------------------------------------------------------- rankings

    public List<RankingItemDTO> rankingInfluenciadores(Map<String, String[]> req) {
        return ranking(req, "p.influenciador");
    }

    public List<RankingItemDTO> rankingMarcas(Map<String, String[]> req) {
        return ranking(req, "p.marca");
    }

    private List<RankingItemDTO> ranking(Map<String, String[]> req, String dimensao) {
        var b = new StringBuilder("""
                select %1$s.id, %1$s.nome, coalesce(sum(f.valorTotal), 0), count(p.id)
                from Publicidade p join %1$s left join p.financeiro f
                where p.ativo = true
                """.formatted(dimensao));
        var params = filtros(req, "p", b);
        b.append(" group by ").append(dimensao).append(".id, ").append(dimensao).append(".nome ");
        b.append(" order by 3 desc ");

        int limite = req.containsKey("limite") ? Integer.parseInt(req.get("limite")[0]) : 10;

        var q = entityManager.createQuery(b.toString());
        params.forEach(q::setParameter);
        q.setMaxResults(limite);

        var resultado = new ArrayList<RankingItemDTO>();
        for (var row : q.getResultList()) {
            var r = (Object[]) row;
            resultado.add(new RankingItemDTO((UUID) r[0], (String) r[1], big(r[2]), lng(r[3])));
        }
        return resultado;
    }

    // ----------------------------------------------------------- distribuições

    public List<DistribuicaoDTO> funilProspecao(Map<String, String[]> req) {
        var b = new StringBuilder("""
                select p.status, count(p.id), coalesce(sum(p.valorProposto), 0)
                from Prospecao p
                where p.ativo = true
                """);
        var params = filtros(req, "p", b);
        b.append(" group by p.status ");
        return distribuicao(b.toString(), params);
    }

    public List<DistribuicaoDTO> distribuicaoStatusPagamento(Map<String, String[]> req) {
        var b = new StringBuilder("""
                select f.statusPagamento, count(f.id), coalesce(sum(f.valorTotal), 0)
                from Publicidade p join p.financeiro f
                where p.ativo = true and f.statusPagamento is not null
                """);
        var params = filtros(req, "p", b);
        b.append(" group by f.statusPagamento ");
        return distribuicao(b.toString(), params);
    }

    public List<DistribuicaoDTO> distribuicaoFormatos(Map<String, String[]> req) {
        var b = new StringBuilder("""
                select fmt.descricao, count(e.id), 0
                from PublicidadeEntregavel e join e.formato fmt join e.publicidade p
                where p.ativo = true
                """);
        var params = filtros(req, "p", b);
        b.append(" group by fmt.descricao order by 2 desc ");
        return distribuicao(b.toString(), params);
    }

    public List<DistribuicaoDTO> distribuicaoStatusEntregaveis(Map<String, String[]> req) {
        var b = new StringBuilder("""
                select e.status, count(e.id), 0
                from PublicidadeEntregavel e join e.publicidade p
                where p.ativo = true
                """);
        var params = filtros(req, "p", b);
        b.append(" group by e.status ");
        return distribuicao(b.toString(), params);
    }

    private List<DistribuicaoDTO> distribuicao(String hql, Map<String, Object> params) {
        var q = entityManager.createQuery(hql);
        params.forEach(q::setParameter);
        var resultado = new ArrayList<DistribuicaoDTO>();
        for (var row : q.getResultList()) {
            var r = (Object[]) row;
            resultado.add(new DistribuicaoDTO(String.valueOf(r[0]), big(r[2]), lng(r[1])));
        }
        return resultado;
    }

    // -------------------------------------------------------- aging recebíveis

    /**
     * Agrupa recebíveis em aberto (PENDENTE/ATRASADO) por faixa de dias relativos à data de
     * vencimento. Faixas negativas = a vencer; positivas = vencido há N dias.
     */
    public List<DistribuicaoDTO> agingRecebiveis(Map<String, String[]> req) {
        var b = new StringBuilder("""
                select f.dataVencimentoNota, f.valorTotal
                from Publicidade p join p.financeiro f
                where p.ativo = true and f.statusPagamento in :abertos
                  and f.dataVencimentoNota is not null
                """);
        var params = filtros(req, "p", b);
        var q = entityManager.createQuery(b.toString());
        q.setParameter("abertos", List.of(StatusPagamento.PENDENTE, StatusPagamento.ATRASADO));
        params.forEach(q::setParameter);

        // buckets: a vencer / 1-15 / 16-30 / 31-60 / 60+
        var labels = List.of("A vencer", "1-15 dias", "16-30 dias", "31-60 dias", "60+ dias");
        var valores = new BigDecimal[labels.size()];
        var qtds = new long[labels.size()];
        Arrays.fill(valores, BigDecimal.ZERO);

        var hoje = LocalDate.now();
        for (var row : q.getResultList()) {
            var r = (Object[]) row;
            var venc = (LocalDate) r[0];
            var valor = big(r[1]);
            long dias = ChronoUnit.DAYS.between(venc, hoje); // >0 = vencido
            int i;
            if (dias <= 0) i = 0;
            else if (dias <= 15) i = 1;
            else if (dias <= 30) i = 2;
            else if (dias <= 60) i = 3;
            else i = 4;
            valores[i] = valores[i].add(valor);
            qtds[i]++;
        }

        var resultado = new ArrayList<DistribuicaoDTO>();
        for (int i = 0; i < labels.size(); i++) {
            resultado.add(new DistribuicaoDTO(labels.get(i), valores[i], qtds[i]));
        }
        return resultado;
    }
}
