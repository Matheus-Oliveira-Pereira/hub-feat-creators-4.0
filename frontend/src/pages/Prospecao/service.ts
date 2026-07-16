import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export type StatusProspecao =
  | 'RASCUNHO'
  | 'CONTATO_INICIAL'
  | 'AGUARDANDO_MARCA'
  | 'AGUARDANDO_ASSESSORA'
  | 'AGUARDANDO_INFLUENCIADOR'
  | 'PUBLICIDADE_FECHADA'
  | 'ENCERRADO';

export type TipoProspecao = 'RECEPTIVO' | 'PROSPECAO';

/** Ordem das colunas do Kanban. */
export const STATUS_ORDEM: StatusProspecao[] = [
  'RASCUNHO',
  'CONTATO_INICIAL',
  'AGUARDANDO_MARCA',
  'AGUARDANDO_ASSESSORA',
  'AGUARDANDO_INFLUENCIADOR',
  'PUBLICIDADE_FECHADA',
  'ENCERRADO',
];

export const STATUS_LABEL: Record<StatusProspecao, string> = {
  RASCUNHO: 'Rascunho',
  CONTATO_INICIAL: 'Contato inicial',
  AGUARDANDO_MARCA: 'Aguardando marca',
  AGUARDANDO_ASSESSORA: 'Aguardando assessora',
  AGUARDANDO_INFLUENCIADOR: 'Aguardando influenciador',
  PUBLICIDADE_FECHADA: 'Publicidade fechada',
  ENCERRADO: 'Encerrado',
};

export const TIPO_LABEL: Record<TipoProspecao, string> = {
  RECEPTIVO: 'Receptivo',
  PROSPECAO: 'Prospecção',
};

/** Status em que é permitido registrar follow-up (dispara e-mail ao contato da marca). */
export const STATUS_PERMITE_FOLLOWUP: StatusProspecao[] = [
  'CONTATO_INICIAL',
  'AGUARDANDO_MARCA',
  'AGUARDANDO_INFLUENCIADOR',
];

/** Status em que o card cobra follow-up automaticamente. */
export const STATUS_PRECISA_FOLLOWUP: StatusProspecao[] = ['CONTATO_INICIAL', 'AGUARDANDO_MARCA'];

function diffDias(iso: string): number {
  const base = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).getTime();
  return Math.floor((Date.now() - base) / (1000 * 60 * 60 * 24));
}

/**
 * Regra de cobrança de follow-up: só nos status CONTATO_INICIAL/AGUARDANDO_MARCA e com
 * o contato inicial confirmado. Sem follow-up ainda → 1 dia após o contato inicial
 * (base: dataEmailContatoInicial, ou dataContato no ativamento manual). Com follow-ups → 3 em 3 dias.
 */
export function precisaFollowUp(p: Prospecao): boolean {
  if (!STATUS_PRECISA_FOLLOWUP.includes(p.status)) return false;
  if (!p.emailContatoInicialEnviado) return false;
  const fus = p.followUps ?? [];
  if (fus.length === 0) {
    const base = p.dataEmailContatoInicial ?? p.dataContato;
    return base ? diffDias(base) >= 1 : false;
  }
  return diffDias(fus[0].data) >= 3;
}

/** Mapeia status para o relatório: negociação agrupa os "aguardando". */
export function statusRelatorio(status: StatusProspecao): string {
  if (status === 'AGUARDANDO_MARCA' || status === 'AGUARDANDO_ASSESSORA' || status === 'AGUARDANDO_INFLUENCIADOR') {
    return 'Em negociação';
  }
  return STATUS_LABEL[status];
}

export interface Ref {
  id: string;
  nome: string;
}

export interface ContatoMarcaRef {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export interface FollowUp {
  id?: string;
  data: string;
  statusProspecao: StatusProspecao;
  observacao: string | null;
  observacoes: string | null;
  logEmail?: { id: string; status: string } | null;
}

export interface Prospecao {
  id: string;
  influenciador: { id: string; nome: string; nicho?: string | null; foto?: string | null };
  marca: { id: string; nome: string; contatos?: ContatoMarcaRef[] };
  contatoMarca: ContatoMarcaRef | null;
  dataContato: string | null;
  tipo: TipoProspecao | null;
  nicho: string | null;
  descricao: string | null;
  observacoes: string | null;
  valorProposto: number | null;
  valorAceito: number | null;
  valorContraproposto: number | null;
  status: StatusProspecao;
  motivoEncerramento: string | null;
  emailContatoInicialEnviado: boolean;
  dataEmailContatoInicial?: string | null;
  publicidadeId?: string | null;
  ativo: boolean;
  followUps: FollowUp[];
  registro?: string;
  ultimaModificacao?: string;
}

export interface ProspecaoForm {
  influenciador: { id: string };
  marca: { id: string };
  contatoMarca: { id: string } | null;
  dataContato: string | null;
  tipo: TipoProspecao;
  nicho: string;
  descricao: string;
  observacoes: string;
  valorProposto: number | null;
  valorAceito: number | null;
  valorContraproposto: number | null;
  status: StatusProspecao;
  motivoEncerramento: string | null;
  emailContatoInicialEnviado: boolean;
}

export interface ProspecaoDTO {
  id: string;
  influenciadorNome: string;
  marcaNome: string;
  tipo: TipoProspecao;
  status: StatusProspecao;
  dataContato: string | null;
  valorAceito: number | null;
  valorProposto: number | null;
  ativo: boolean;
}

const baseService = new BaseService<ProspecaoDTO>('/prospecoes');

export const prospecaoService = {
  buscar: (id: string): Promise<Prospecao> => baseService.getById(id) as Promise<Prospecao>,

  salvar: (data: ProspecaoForm) => baseService.create(data as unknown as Partial<ProspecaoDTO>),

  atualizar: (id: string, data: Partial<Prospecao>) =>
    baseService.update(id, data as unknown as Partial<ProspecaoDTO>),

  desativar: (id: string) => baseService.desativar(id),
  restaurar: (id: string) => baseService.restaurar(id),
  excluir: (id: string) => baseService.remove(id),
  historico: (id: string) => baseService.getHistorico(id),

  porInfluenciador: async (influenciadorId: string): Promise<Prospecao[]> => {
    const r = await api.get<Prospecao[]>(`/prospecoes/por-influenciador/${influenciadorId}`);
    return r.data;
  },

  registrarFollowUp: async (id: string, payload: { assunto: string; corpo: string; observacoes?: string; cc?: string[]; cco?: string[] }): Promise<FollowUp> => {
    const r = await api.post<FollowUp>(`/prospecoes/${id}/follow-up`, payload);
    return r.data;
  },

  enviarEmailContato: async (id: string, payload: { assunto: string; corpo: string; cc?: string[]; cco?: string[] }): Promise<{ status: string }> => {
    const r = await api.post<{ status: string }>(`/prospecoes/${id}/email`, payload);
    return r.data;
  },

  listarInfluenciadoresAtivos: async (): Promise<Array<{ id: string; nome: string; nicho?: string | null }>> => {
    const r = await api.get<Array<{ id: string; nome: string; nicho?: string | null }>>('/influenciadores/ativos');
    return r.data;
  },

  listarMarcasAtivas: async (): Promise<Ref[]> => {
    const r = await api.get<Ref[]>('/marcas/ativos');
    return r.data;
  },

  buscarMarca: async (id: string): Promise<{ id: string; nome: string; contatos: ContatoMarcaRef[] }> => {
    const r = await api.get<{ id: string; nome: string; contatos: ContatoMarcaRef[] }>(`/marcas/${id}`);
    return r.data;
  },
};
