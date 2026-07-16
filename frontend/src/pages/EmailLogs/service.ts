import BaseService, { PaginatedResponse } from '../../services/baseService';

export interface LogEmailDTO {
  id: string;
  titulo: string;
  destinatarios: string;
  copia: string | null;
  copiaOculta: string | null;
  conta: string | null;
  status: 'SUCESSO' | 'FALHA' | 'CANCELADO';
  erro: string | null;
  registro: string;
  criadoPor: string;
}

export interface LogEmailFiltros {
  status?: string[];
  titulo?: string;
  destinatario?: string;
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  textoDeBusca?: string;
}

const baseService = new BaseService<LogEmailDTO>('/emails');

function buildQuery(page: number, size: number, filtros: LogEmailFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`titulo=${filtros.textoDeBusca}`);
  if (filtros.status?.length) query.push(`status=${filtros.status.join(',')}`);
  if (filtros.titulo?.length) query.push(`titulo=${filtros.titulo}`);
  if (filtros.destinatario?.length) query.push(`destinatario=${filtros.destinatario}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  return query;
}

export const emailLogService = {
  listar: (page: number, size: number, filtros: LogEmailFiltros): Promise<PaginatedResponse<LogEmailDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),
};

export const STATUS_EMAIL_OPTIONS = [
  { label: 'Sucesso', value: 'SUCESSO' },
  { label: 'Falha', value: 'FALHA' },
  { label: 'Cancelado', value: 'CANCELADO' },
];
