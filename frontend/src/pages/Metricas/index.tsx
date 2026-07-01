import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { TabView, TabPanel } from 'primereact/tabview';
import { pdf } from '@react-pdf/renderer';
import 'chart.js/auto';
import {
  metricasService,
  MetricasFiltros,
  Distribuicao,
  RankingItem,
  SerieTemporal,
  formatarMoeda,
  STATUS_PAGAMENTO_LABEL,
  STATUS_PROSPECAO_LABEL,
  STATUS_ENTREGAVEL_LABEL,
} from './service';
import MetricasReportDocument from './components/MetricasReportDocument';
import './styles.scss';

const LIME = '#C2E000';
const PALETA = ['#C2E000', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#06B6D4', '#EC4899'];
const COR_PAGAMENTO: Record<string, string> = { RECEBIDO: '#22C55E', PENDENTE: '#F59E0B', ATRASADO: '#EF4444' };

function toIso(d: Date | null): string | null {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rotular(d: Distribuicao[], dict: Record<string, string>): string[] {
  return d.map((x) => dict[x.categoria] ?? x.categoria);
}

const chartOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#6B7280' } } },
  scales: {
    x: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
    y: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(0,0,0,0.06)' } },
  },
};

const pieOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { color: '#6B7280' } } },
};

function Metricas() {
  const [dataDe, setDataDe] = useState<Date | null>(null);
  const [dataAte, setDataAte] = useState<Date | null>(null);
  const [influenciador, setInfluenciador] = useState<string[]>([]);
  const [marca, setMarca] = useState<string[]>([]);
  const [tab, setTab] = useState(0);
  const [exportando, setExportando] = useState(false);

  const filtros: MetricasFiltros = useMemo(
    () => ({ dataDe: toIso(dataDe), dataAte: toIso(dataAte), influenciador, marca }),
    [dataDe, dataAte, influenciador, marca]
  );
  const chave = JSON.stringify(filtros);

  const { data: influenciadores = [] } = useQuery({
    queryKey: ['metricas-influenciadores'],
    queryFn: metricasService.listarInfluenciadoresAtivos,
    staleTime: 5 * 60 * 1000,
  });
  const { data: marcas = [] } = useQuery({
    queryKey: ['metricas-marcas'],
    queryFn: metricasService.listarMarcasAtivas,
    staleTime: 5 * 60 * 1000,
  });

  const resumoQ = useQuery({ queryKey: ['metricas-resumo', chave], queryFn: () => metricasService.resumo(filtros) });
  const fatQ = useQuery({ queryKey: ['metricas-fat', chave], queryFn: () => metricasService.faturamentoMensal(filtros) });
  const pagQ = useQuery({ queryKey: ['metricas-pag', chave], queryFn: () => metricasService.statusPagamento(filtros) });
  const funilQ = useQuery({ queryKey: ['metricas-funil', chave], queryFn: () => metricasService.funil(filtros) });
  const rankInfQ = useQuery({ queryKey: ['metricas-rank-inf', chave], queryFn: () => metricasService.rankingInfluenciadores({ ...filtros, limite: 10 }) });
  const rankMrcQ = useQuery({ queryKey: ['metricas-rank-mrc', chave], queryFn: () => metricasService.rankingMarcas({ ...filtros, limite: 10 }) });
  const formatosQ = useQuery({ queryKey: ['metricas-formatos', chave], queryFn: () => metricasService.formatos(filtros) });
  const statusEntQ = useQuery({ queryKey: ['metricas-status-ent', chave], queryFn: () => metricasService.statusEntregaveis(filtros) });
  const agingQ = useQuery({ queryKey: ['metricas-aging', chave], queryFn: () => metricasService.aging(filtros) });

  const resumo = resumoQ.data;

  function limpar() {
    setDataDe(null);
    setDataAte(null);
    setInfluenciador([]);
    setMarca([]);
  }

  async function exportarPdf() {
    if (!resumo) return;
    setExportando(true);
    try {
      const periodo = dataDe || dataAte
        ? `Período: ${dataDe ? dataDe.toLocaleDateString('pt-BR') : '—'} a ${dataAte ? dataAte.toLocaleDateString('pt-BR') : '—'}`
        : 'Todos os períodos';
      const blob = await pdf(
        <MetricasReportDocument
          resumo={resumo}
          rankingInfluenciadores={rankInfQ.data ?? []}
          rankingMarcas={rankMrcQ.data ?? []}
          funil={funilQ.data ?? []}
          periodo={periodo}
        />
      ).toBlob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `metricas-feat-creators-${toIso(new Date())}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setExportando(false);
    }
  }

  // --- chart data ---
  const fatData = (s: SerieTemporal[] = []) => ({
    labels: s.map((p) => p.label),
    datasets: [{ label: 'Faturamento', data: s.map((p) => p.valor), borderColor: LIME, backgroundColor: 'rgba(194,224,0,0.15)', tension: 0.3, fill: true }],
  });
  const pagData = (d: Distribuicao[] = []) => ({
    labels: rotular(d, STATUS_PAGAMENTO_LABEL),
    datasets: [{ data: d.map((x) => x.valor), backgroundColor: d.map((x) => COR_PAGAMENTO[x.categoria] ?? LIME) }],
  });
  const rankData = (r: RankingItem[] = [], label: string) => ({
    labels: r.map((x) => x.nome),
    datasets: [{ label, data: r.map((x) => x.valor), backgroundColor: LIME }],
  });
  const funilData = (d: Distribuicao[] = []) => ({
    labels: rotular(d, STATUS_PROSPECAO_LABEL),
    datasets: [{ label: 'Prospecções', data: d.map((x) => x.quantidade), backgroundColor: PALETA }],
  });
  const distData = (d: Distribuicao[] = [], dict?: Record<string, string>) => ({
    labels: dict ? rotular(d, dict) : d.map((x) => x.categoria),
    datasets: [{ data: d.map((x) => x.quantidade), backgroundColor: PALETA }],
  });
  const agingData = (d: Distribuicao[] = []) => ({
    labels: d.map((x) => x.categoria),
    datasets: [{ label: 'Valor em aberto', data: d.map((x) => x.valor), backgroundColor: ['#22C55E', '#F59E0B', '#F97316', '#EF4444', '#B91C1C'] }],
  });
  const horizOptions = { ...chartOptions, indexAxis: 'y' as const };

  const kpis = resumo ? [
    { label: 'Faturamento total', valor: formatarMoeda(resumo.faturamentoTotal) },
    { label: 'Receita assessoria', valor: formatarMoeda(resumo.receitaAssessora) },
    { label: 'Repasse influenciadores', valor: formatarMoeda(resumo.repasseInfluenciador) },
    { label: 'Recebido', valor: formatarMoeda(resumo.valorRecebido), sub: `${resumo.countRecebido} nota(s)` },
    { label: 'Pendente', valor: formatarMoeda(resumo.valorPendente), sub: `${resumo.countPendente} nota(s)` },
    { label: 'Atrasado', valor: formatarMoeda(resumo.valorAtrasado), sub: `${resumo.countAtrasado} nota(s)` },
    { label: 'Ticket médio', valor: formatarMoeda(resumo.ticketMedio) },
    { label: 'Total de deals', valor: String(resumo.totalDeals) },
    { label: 'Prospecções', valor: String(resumo.totalProspecoes) },
    { label: 'Taxa de conversão', valor: `${resumo.taxaConversao}%`, sub: `${resumo.prospecoesFechadas} fechada(s)` },
    { label: 'Em negociação', valor: formatarMoeda(resumo.valorEmNegociacao) },
    { label: 'Valor fechado', valor: formatarMoeda(resumo.valorFechado) },
  ] : [];

  return (
    <div className="metricas-page">
      <div className="page-header">
        <div>
          <h1>Métricas</h1>
          <p>Visão analítica por influenciador e por marca</p>
        </div>
        <button type="button" className="btn-export" onClick={exportarPdf} disabled={exportando || !resumo}>
          <i className="pi pi-file-pdf" />
          {exportando ? 'Gerando...' : 'Exportar PDF'}
        </button>
      </div>

      <div className="filtros-bar">
        <div className="filtro">
          <label>De</label>
          <Calendar value={dataDe} onChange={(e) => setDataDe((e.value as Date) ?? null)} dateFormat="dd/mm/yy" showButtonBar placeholder="Início" />
        </div>
        <div className="filtro">
          <label>Até</label>
          <Calendar value={dataAte} onChange={(e) => setDataAte((e.value as Date) ?? null)} dateFormat="dd/mm/yy" showButtonBar placeholder="Fim" />
        </div>
        <div className="filtro filtro-grow">
          <label>Influenciadores</label>
          <MultiSelect value={influenciador} onChange={(e) => setInfluenciador(e.value)} options={influenciadores}
            optionLabel="nome" optionValue="id" filter display="chip" placeholder="Todos" />
        </div>
        <div className="filtro filtro-grow">
          <label>Marcas</label>
          <MultiSelect value={marca} onChange={(e) => setMarca(e.value)} options={marcas}
            optionLabel="nome" optionValue="id" filter display="chip" placeholder="Todas" />
        </div>
        <button type="button" className="btn-limpar" onClick={limpar}><i className="pi pi-filter-slash" />Limpar</button>
      </div>

      <TabView activeIndex={tab} onTabChange={(e) => setTab(e.index)}>
        <TabPanel header="Geral" leftIcon="pi pi-th-large mr-2">
          <div className="kpi-grid">
            {kpis.map((k) => (
              <div key={k.label} className="kpi-card">
                <span className="kpi-value">{k.valor}</span>
                <span className="kpi-label">{k.label}</span>
                {k.sub && <span className="kpi-sub">{k.sub}</span>}
              </div>
            ))}
          </div>
          <div className="chart-grid">
            <div className="chart-card chart-wide">
              <h3>Faturamento por mês</h3>
              <ChartBox empty={!fatQ.data?.length}><Chart type="line" data={fatData(fatQ.data)} options={chartOptions} /></ChartBox>
            </div>
            <div className="chart-card">
              <h3>Funil de prospecção</h3>
              <ChartBox empty={!funilQ.data?.length}><Chart type="bar" data={funilData(funilQ.data)} options={horizOptions} /></ChartBox>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Financeiro" leftIcon="pi pi-dollar mr-2">
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Status de pagamento</h3>
              <ChartBox empty={!pagQ.data?.length}><Chart type="doughnut" data={pagData(pagQ.data)} options={pieOptions} /></ChartBox>
            </div>
            <div className="chart-card">
              <h3>Aging de recebíveis</h3>
              <ChartBox empty={!agingQ.data?.some((d) => d.quantidade > 0)}><Chart type="bar" data={agingData(agingQ.data)} options={chartOptions} /></ChartBox>
            </div>
            <div className="chart-card chart-wide">
              <h3>Faturamento por mês</h3>
              <ChartBox empty={!fatQ.data?.length}><Chart type="line" data={fatData(fatQ.data)} options={chartOptions} /></ChartBox>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Por Influenciador" leftIcon="pi pi-star mr-2">
          <div className="chart-card chart-full">
            <h3>Top influenciadores por faturamento</h3>
            <ChartBox tall empty={!rankInfQ.data?.length}><Chart type="bar" data={rankData(rankInfQ.data, 'Faturamento')} options={horizOptions} /></ChartBox>
          </div>
          <RankingTabela itens={rankInfQ.data ?? []} />
        </TabPanel>

        <TabPanel header="Por Marca" leftIcon="pi pi-bookmark mr-2">
          <div className="chart-card chart-full">
            <h3>Top marcas por faturamento</h3>
            <ChartBox tall empty={!rankMrcQ.data?.length}><Chart type="bar" data={rankData(rankMrcQ.data, 'Faturamento')} options={horizOptions} /></ChartBox>
          </div>
          <RankingTabela itens={rankMrcQ.data ?? []} />
        </TabPanel>

        <TabPanel header="Entregáveis" leftIcon="pi pi-box mr-2">
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Por formato</h3>
              <ChartBox empty={!formatosQ.data?.length}><Chart type="doughnut" data={distData(formatosQ.data)} options={pieOptions} /></ChartBox>
            </div>
            <div className="chart-card">
              <h3>Por status</h3>
              <ChartBox empty={!statusEntQ.data?.length}><Chart type="doughnut" data={distData(statusEntQ.data, STATUS_ENTREGAVEL_LABEL)} options={pieOptions} /></ChartBox>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}

function ChartBox({ tall, empty, children }: Readonly<{ tall?: boolean; empty: boolean; children: ReactNode }>) {
  return (
    <div className={`chart-box${tall ? ' chart-box-tall' : ''}`}>
      {empty ? (
        <div className="chart-empty">
          <i className="pi pi-chart-bar" />
          <span>Sem dados no período</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function RankingTabela({ itens }: Readonly<{ itens: RankingItem[] }>) {
  return (
    <div className="ranking-tabela">
      <div className="ranking-row ranking-head">
        <span>Nome</span><span>Deals</span><span>Faturamento</span>
      </div>
      {itens.map((i) => (
        <div key={i.id} className="ranking-row">
          <span>{i.nome}</span><span>{i.quantidade}</span><span>{formatarMoeda(i.valor)}</span>
        </div>
      ))}
      {itens.length === 0 && <div className="ranking-row"><span>Sem dados no período.</span></div>}
    </div>
  );
}

export default Metricas;
