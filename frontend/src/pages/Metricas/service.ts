import api from '../../services/api';

export interface Ref {
  id: string;
  nome: string;
}

export interface MetricasResumo {
  faturamentoTotal: number;
  receitaAssessora: number;
  repasseInfluenciador: number;
  valorRecebido: number;
  valorPendente: number;
  valorAtrasado: number;
  countRecebido: number;
  countPendente: number;
  countAtrasado: number;
  totalNotas: number;
  ticketMedio: number;
  totalDeals: number;
  totalProspecoes: number;
  prospecoesFechadas: number;
  prospecoesEncerradas: number;
  prospecoesEmAndamento: number;
  taxaConversao: number;
  valorEmNegociacao: number;
  valorFechado: number;
}

export interface SerieTemporal {
  label: string;
  valor: number;
  quantidade: number;
}

export interface RankingItem {
  id: string;
  nome: string;
  valor: number;
  quantidade: number;
}

export interface Distribuicao {
  categoria: string;
  valor: number;
  quantidade: number;
}

export interface MetricasFiltros {
  dataDe?: string | null;
  dataAte?: string | null;
  influenciador?: string[];
  marca?: string[];
  limite?: number;
}

/** Monta query string explícita (padrão do projeto: array joined com &, multi-valor comma-separated). */
export function buildQuery(filtros: MetricasFiltros): string {
  const q: string[] = [];
  if (filtros.dataDe) q.push(`dataDe=${filtros.dataDe}`);
  if (filtros.dataAte) q.push(`dataAte=${filtros.dataAte}`);
  if (filtros.influenciador?.length) q.push(`influenciador=${filtros.influenciador.join(',')}`);
  if (filtros.marca?.length) q.push(`marca=${filtros.marca.join(',')}`);
  if (filtros.limite) q.push(`limite=${filtros.limite}`);
  return q.length ? '?' + q.join('&') : '';
}

async function get<T>(path: string, filtros: MetricasFiltros): Promise<T> {
  const r = await api.get<T>(`/metricas${path}${buildQuery(filtros)}`);
  return r.data;
}

export const metricasService = {
  resumo: (f: MetricasFiltros) => get<MetricasResumo>('/resumo', f),
  faturamentoMensal: (f: MetricasFiltros) => get<SerieTemporal[]>('/faturamento-mensal', f),
  funil: (f: MetricasFiltros) => get<Distribuicao[]>('/funil', f),
  statusPagamento: (f: MetricasFiltros) => get<Distribuicao[]>('/status-pagamento', f),
  rankingInfluenciadores: (f: MetricasFiltros) => get<RankingItem[]>('/ranking/influenciadores', f),
  rankingMarcas: (f: MetricasFiltros) => get<RankingItem[]>('/ranking/marcas', f),
  formatos: (f: MetricasFiltros) => get<Distribuicao[]>('/entregaveis/formatos', f),
  statusEntregaveis: (f: MetricasFiltros) => get<Distribuicao[]>('/entregaveis/status', f),
  aging: (f: MetricasFiltros) => get<Distribuicao[]>('/aging', f),

  listarInfluenciadoresAtivos: async (): Promise<Ref[]> => {
    const r = await api.get<Ref[]>('/influenciadores/ativos');
    return r.data;
  },
  listarMarcasAtivas: async (): Promise<Ref[]> => {
    const r = await api.get<Ref[]>('/marcas/ativos');
    return r.data;
  },
};

export const STATUS_PAGAMENTO_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  RECEBIDO: 'Recebido',
  ATRASADO: 'Atrasado',
};

export const STATUS_PROSPECAO_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  CONTATO_INICIAL: 'Contato inicial',
  AGUARDANDO_MARCA: 'Aguardando marca',
  AGUARDANDO_INFLUENCIADOR: 'Aguardando influenciador',
  AGUARDANDO_ASSESSORA: 'Aguardando assessora',
  PUBLICIDADE_FECHADA: 'Fechada',
  ENCERRADO: 'Encerrado',
};

export const STATUS_ENTREGAVEL_LABEL: Record<string, string> = {
  PRODUCAO: 'Produção',
  REVISAO_MARCA: 'Revisão da marca',
  REFACAO: 'Refação',
  ATRASADO: 'Atrasado',
  PUBLICADO: 'Publicado',
};

export function formatarMoeda(v: number | null | undefined): string {
  if (v == null) return 'R$ 0';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
