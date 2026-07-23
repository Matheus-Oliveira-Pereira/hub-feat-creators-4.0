import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export type StatusTarefa = 'A_FAZER' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDA' | 'CANCELADA';
export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA';
export type TipoResponsavelTarefa = 'ASSESSORA' | 'INFLUENCIADOR';
export type TipoLembreteTarefa = 'UMA_SEMANA_ANTES' | 'UM_DIA_ANTES' | 'NO_DIA' | 'UM_DIA_ATRASO';
export type TipoRecorrenciaTarefa = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const STATUS_TAREFA_LABEL: Record<StatusTarefa, string> = {
  A_FAZER: 'A Fazer',
  EM_ANDAMENTO: 'Em Andamento',
  EM_REVISAO: 'Em Revisão',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const PRIORIDADE_LABEL: Record<PrioridadeTarefa, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
};

export const TIPO_RESPONSAVEL_LABEL: Record<TipoResponsavelTarefa, string> = {
  ASSESSORA: 'Assessora',
  INFLUENCIADOR: 'Influenciador',
};

export const LEMBRETE_LABEL: Record<TipoLembreteTarefa, string> = {
  UMA_SEMANA_ANTES: '1 semana antes',
  UM_DIA_ANTES: '1 dia antes',
  NO_DIA: 'No dia',
  UM_DIA_ATRASO: '1 dia de atraso',
};

export const RECORRENCIA_LABEL: Record<TipoRecorrenciaTarefa, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

/** Colunas do kanban, na ordem; CANCELADA fica fora do quadro padrão. */
export const KANBAN_ORDEM: StatusTarefa[] = ['A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA'];

export interface Ref {
  id: string;
  nome: string;
}

export interface ChecklistItem {
  id?: string;
  descricao: string;
  concluido: boolean;
  ordem?: number;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  observacoes: string | null;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  tipoResponsavel: TipoResponsavelTarefa;
  usuarioResponsavel: Ref | null;
  influenciadorResponsavel: Ref | null;
  influenciador: Ref | null;
  marca: Ref | null;
  publicidade: { id: string } | null;
  prospecao: { id: string } | null;
  dataInicio: string | null;
  previsaoExecucao: string | null;
  dataExecucao: string | null;
  previsaoTermino: string | null;
  dataConclusao: string | null;
  notificacaoAutomatica: boolean;
  lembretes: TipoLembreteTarefa[];
  checklist: ChecklistItem[];
  recorrencia: TipoRecorrenciaTarefa | null;
  recorrenciaFim: string | null;
  recorrenciaMaxOcorrencias: number | null;
  recorrenciaOcorrencia: number;
  ativo: boolean;
}

export interface TarefaForm {
  titulo: string;
  descricao: string | null;
  observacoes: string | null;
  status: StatusTarefa | null;
  prioridade: PrioridadeTarefa;
  tipoResponsavel: TipoResponsavelTarefa;
  usuarioResponsavel: { id: string } | null;
  influenciadorResponsavel: { id: string } | null;
  influenciador: { id: string } | null;
  marca: { id: string } | null;
  publicidade: { id: string } | null;
  prospecao: { id: string } | null;
  dataInicio: string | null;
  previsaoExecucao: string | null;
  dataExecucao: string | null;
  previsaoTermino: string | null;
  notificacaoAutomatica: boolean;
  lembretes: TipoLembreteTarefa[];
  checklist: ChecklistItem[];
  recorrencia: TipoRecorrenciaTarefa | null;
  recorrenciaFim: string | null;
  recorrenciaMaxOcorrencias: number | null;
}

export interface TarefaDTO {
  id: string;
  titulo: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  tipoResponsavel: TipoResponsavelTarefa;
  usuarioResponsavelNome: string | null;
  influenciadorResponsavelNome: string | null;
  influenciadorNome: string | null;
  marcaNome: string | null;
  dataInicio: string | null;
  previsaoExecucao: string | null;
  previsaoTermino: string | null;
  dataConclusao: string | null;
  notificacaoAutomatica: boolean;
  recorrencia: TipoRecorrenciaTarefa | null;
  totalChecklist: number;
  checklistConcluidos: number;
  ativo: boolean;
}

export interface TarefaFiltros {
  textoDeBusca?: string;
  status?: string[];
  prioridade?: string[];
  usuarioResponsavel?: string;
  influenciadorResponsavel?: string;
  influenciador?: string;
  marca?: string;
  previsaoDe?: string;
  previsaoAte?: string;
  atrasadas?: boolean;
  recorrentes?: boolean;
  mostrarInativos?: boolean;
}

/** Pré-preenchimento ao criar tarefa a partir de publicidade/prospecção. */
export interface TarefaInicial {
  publicidadeId?: string;
  prospecaoId?: string;
  influenciador?: Ref | null;
  marca?: Ref | null;
  descricao?: string | null;
}

/** Nome do responsável de um DTO (assessora ou influenciador). */
export function responsavelNome(t: TarefaDTO): string {
  return t.usuarioResponsavelNome ?? t.influenciadorResponsavelNome ?? '—';
}

/** Atrasada: previsão de término vencida e não concluída/cancelada. */
export function estaAtrasada(t: Pick<TarefaDTO, 'previsaoTermino' | 'status'>): boolean {
  if (!t.previsaoTermino || t.status === 'CONCLUIDA' || t.status === 'CANCELADA') return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(t.previsaoTermino + 'T00:00:00') < hoje;
}

/** ISO (yyyy-MM-dd) → Date local, sem shift de fuso. */
export function isoToDate(iso: string | null): Date | null {
  return iso ? new Date(iso + 'T00:00:00') : null;
}

/** Date → ISO (yyyy-MM-dd) local. */
export function dateToIso(d: Date | null): string | null {
  if (!d) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function formatarData(iso: string | null): string {
  const d = isoToDate(iso);
  return d ? d.toLocaleDateString('pt-BR') : '—';
}

const baseService = new BaseService<TarefaDTO>('/tarefas');

export function buildQuery(page: number, size: number, filtros: TarefaFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) query.push(`status=${filtros.status.join(',')}`);
  if (filtros.prioridade?.length) query.push(`prioridade=${filtros.prioridade.join(',')}`);
  if (filtros.usuarioResponsavel?.length) query.push(`usuarioResponsavel=${filtros.usuarioResponsavel}`);
  if (filtros.influenciadorResponsavel?.length) query.push(`influenciadorResponsavel=${filtros.influenciadorResponsavel}`);
  if (filtros.influenciador?.length) query.push(`influenciador=${filtros.influenciador}`);
  if (filtros.marca?.length) query.push(`marca=${filtros.marca}`);
  if (filtros.previsaoDe?.length) query.push(`previsaoDe=${filtros.previsaoDe}`);
  if (filtros.previsaoAte?.length) query.push(`previsaoAte=${filtros.previsaoAte}`);
  if (filtros.atrasadas) query.push('atrasadas=true');
  if (filtros.recorrentes) query.push('recorrentes=true');
  if (filtros.mostrarInativos) query.push('mostrarInativos=true');
  return query;
}

export interface EnvioEmailPayload {
  assunto?: string;
  corpo?: string;
  cc?: string[];
  cco?: string[];
}

export const tarefaService = {
  listar: (page: number, size: number, filtros: TarefaFiltros): Promise<PaginatedResponse<TarefaDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<Tarefa> => baseService.getById(id) as unknown as Promise<Tarefa>,

  salvar: (data: TarefaForm) => baseService.create(data as unknown as Partial<TarefaDTO>),

  atualizar: (id: string, data: TarefaForm) => baseService.update(id, data as unknown as Partial<TarefaDTO>),

  alterarStatus: async (id: string, status: StatusTarefa): Promise<Tarefa> => {
    const r = await api.patch<Tarefa>(`/tarefas/${id}/status`, { status });
    return r.data;
  },

  enviarEmail: async (id: string, payload: EnvioEmailPayload) => {
    const r = await api.post(`/tarefas/${id}/email`, payload);
    return r.data;
  },

  desativar: (id: string) => baseService.desativar(id),
  restaurar: (id: string) => baseService.restaurar(id),
  excluir: (id: string) => baseService.remove(id),
  historico: (id: string) => baseService.getHistorico(id),

  listarUsuariosAtivos: async (): Promise<Ref[]> => {
    const r = await api.get<Ref[]>('/tarefas/usuarios-ativos');
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
