import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export type StatusEntregavel = 'PRODUCAO' | 'REVISAO_MARCA' | 'REFACAO' | 'ATRASADO' | 'PUBLICADO';
export type StatusNota = 'NAO_EMITIDA' | 'EMITIDA' | 'ENVIADA';
export type StatusPagamento = 'PENDENTE' | 'RECEBIDO' | 'ATRASADO';
export type FormaPagamento = 'TRANSFERENCIA' | 'PIX' | 'PAYPAL';
export type Moeda = 'BRL' | 'USD';

/** Dias após o fechamento sem nota emitida que disparam o alerta "nota atrasada". */
export const DIAS_ALERTA_NOTA = 7;

export const MOEDA_LABEL: Record<Moeda, string> = {
  BRL: 'Real (R$)',
  USD: 'Dólar (US$)',
};

/** Formata valor monetário conforme a moeda (BRL → pt-BR, USD → en-US). */
export function formatarMoeda(v: number | null, moeda: Moeda | null = 'BRL'): string {
  if (v == null) return '—';
  const m = moeda ?? 'BRL';
  const locale = m === 'USD' ? 'en-US' : 'pt-BR';
  return v.toLocaleString(locale, { style: 'currency', currency: m });
}

export const STATUS_ENTREGAVEL_LABEL: Record<StatusEntregavel, string> = {
  PRODUCAO: 'Produção',
  REVISAO_MARCA: 'Revisão da marca',
  REFACAO: 'Refação',
  ATRASADO: 'Atrasado',
  PUBLICADO: 'Publicado',
};

export const STATUS_NOTA_LABEL: Record<StatusNota, string> = {
  NAO_EMITIDA: 'Não emitida',
  EMITIDA: 'Emitida',
  ENVIADA: 'Enviada',
};

export const STATUS_PAGAMENTO_LABEL: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  RECEBIDO: 'Recebido',
  ATRASADO: 'Atrasado',
};

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  TRANSFERENCIA: 'Transferência',
  PIX: 'Pix',
  PAYPAL: 'PayPal',
};

export interface Ref {
  id: string;
  nome: string;
}

export interface FormatoRef {
  id: string;
  descricao: string;
}

export interface Entregavel {
  id?: string;
  status: StatusEntregavel;
  escopo: string;
  dataEntrega: string | null;
  formato: FormatoRef | null;
}

export interface Financeiro {
  id?: string;
  dataEnvioNota: string | null;
  numeroNota: string | null;
  linkNota: string | null;
  dataVencimentoNota: string | null;
  moeda: Moeda;
  statusNota: StatusNota;
  statusPagamento: StatusPagamento;
  formaPagamento: FormaPagamento | null;
  dataRecebimento: string | null;
  dataPrevistaRecebimento: string | null;
  valorTotal: number | null;
  valorAssessora: number | null;
  valorInfluenciador: number | null;
}

export interface Publicidade {
  id: string;
  marca: Ref;
  influenciador: Ref;
  prospecao: { id: string } | null;
  descricao: string | null;
  observacoes: string | null;
  parceiro: string | null;
  porcentagemAssessora: number;
  ativo: boolean;
  financeiro: Financeiro | null;
  entregaveis: Entregavel[];
}

export interface PublicidadeForm {
  marca: { id: string };
  influenciador: { id: string };
  prospecao: { id: string } | null;
  descricao: string;
  observacoes: string;
  parceiro: string;
  porcentagemAssessora: number;
  financeiro: Financeiro;
  entregaveis: Entregavel[];
}

export interface PublicidadeDTO {
  id: string;
  marcaNome: string;
  influenciadorNome: string;
  parceiro: string | null;
  statusNota: StatusNota | null;
  statusPagamento: StatusPagamento | null;
  moeda: Moeda | null;
  valorTotal: number | null;
  dataPrevistaRecebimento: string | null;
  registro: string | null;
  ativo: boolean;
  qtdEntregaveis: number;
}

export interface PublicidadeFiltros {
  marca?: string;
  parceiro?: string;
  statusNota?: string[];
  statusPagamento?: string[];
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

const baseService = new BaseService<PublicidadeDTO>('/publicidades');

function buildQuery(page: number, size: number, filtros: PublicidadeFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.marca?.length) query.push(`marca=${filtros.marca}`);
  if (filtros.parceiro?.length) query.push(`parceiro=${filtros.parceiro}`);
  if (filtros.statusNota?.length) query.push(`statusNota=${filtros.statusNota.join(',')}`);
  if (filtros.statusPagamento?.length) query.push(`statusPagamento=${filtros.statusPagamento.join(',')}`);
  if (filtros.mostrarInativos) query.push('mostrarInativos=true');
  return query;
}

export const publicidadeService = {
  listar: (page: number, size: number, filtros: PublicidadeFiltros): Promise<PaginatedResponse<PublicidadeDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<Publicidade> => baseService.getById(id) as Promise<Publicidade>,

  salvar: (data: PublicidadeForm) => baseService.create(data as unknown as Partial<PublicidadeDTO>),

  atualizar: (id: string, data: PublicidadeForm) => baseService.update(id, data as unknown as Partial<PublicidadeDTO>),

  desativar: (id: string) => baseService.desativar(id),
  restaurar: (id: string) => baseService.restaurar(id),
  excluir: (id: string) => baseService.remove(id),
  historico: (id: string) => baseService.getHistorico(id),

  listarFormatos: async (): Promise<FormatoRef[]> => {
    const r = await api.get<FormatoRef[]>('/publicidades/formatos');
    return r.data;
  },

  listarInfluenciadoresAtivos: async (): Promise<Ref[]> => {
    const r = await api.get<Ref[]>('/influenciadores/ativos');
    return r.data;
  },

  listarMarcasAtivas: async (): Promise<Ref[]> => {
    const r = await api.get<Ref[]>('/marcas/ativos');
    return r.data;
  },
};
