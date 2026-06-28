import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export interface ContaEmailDTO {
  id: string;
  nome: string;
  usuario: string;
  host: string;
  porta: number | null;
  sistema: boolean;
  status: string;
}

export interface ContaEmail {
  id: string;
  nome: string;
  host: string;
  porta: number | null;
  usuario: string;
  remetenteNome: string | null;
  tls: boolean | null;
  sistema: boolean;
  status: string;
}

export interface ContaEmailForm {
  nome: string;
  host: string;
  porta: number | null;
  usuario: string;
  remetenteNome: string;
  senha?: string;
  tls: boolean;
  sistema: boolean;
  status: string;
}

export interface ImportacaoLinhaDTO {
  linha: number;
  nome: string;
  status: 'SUCESSO' | 'DUPLICADO' | 'ERRO';
  erro: string | null;
}

export interface ImportacaoResultadoDTO {
  totalLinhas: number;
  sucesso: number;
  duplicados: number;
  erros: number;
  detalhes: ImportacaoLinhaDTO[];
}

export interface ContaEmailFiltros {
  status?: string[];
  nome?: string;
  usuario?: string;
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

const baseService = new BaseService<ContaEmailDTO>('/contas-email');

function buildQuery(page: number, size: number, filtros: ContaEmailFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  if (filtros.nome?.length) query.push(`nome=${filtros.nome}`);
  if (filtros.usuario?.length) query.push(`usuario=${filtros.usuario}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  return query;
}

export const contaEmailService = {
  listar: (page: number, size: number, filtros: ContaEmailFiltros): Promise<PaginatedResponse<ContaEmailDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<ContaEmail> =>
    baseService.getById(id) as Promise<ContaEmail>,

  salvar: (data: Partial<ContaEmailForm>) =>
    baseService.create(data),

  atualizar: (id: string, data: Partial<ContaEmailForm>) =>
    baseService.update(id, data),

  desativar: (id: string) =>
    baseService.desativar(id),

  restaurar: (id: string) =>
    baseService.restaurar(id),

  excluir: (id: string) =>
    baseService.remove(id),

  historico: (id: string) =>
    baseService.getHistorico(id),

  listarAtivos: async (): Promise<ContaEmail[]> => {
    const response = await api.get<ContaEmail[]>('/contas-email/ativos');
    return response.data;
  },

  enviarTeste: async (contaId: string, destino: string): Promise<{ sucesso: boolean; erro: string | null }> => {
    const response = await api.post<{ sucesso: boolean; erro: string | null }>('/emails/teste', { destino, contaId });
    return response.data;
  },

  importarCSV: async (arquivo: File): Promise<ImportacaoResultadoDTO> => {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    const response = await api.post<ImportacaoResultadoDTO>('/contas-email/importacao', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/contas-email/importacao/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contas_email_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
