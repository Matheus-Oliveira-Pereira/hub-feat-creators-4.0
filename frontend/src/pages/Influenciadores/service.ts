import BaseService, { PaginatedResponse } from '../../services/baseService';

export interface InfluenciadorDTO {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  instagram: string | null;
  status: string;
}

export interface Influenciador {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  instagram: string | null;
  tiktok: string | null;
  linkedin: string | null;
  youtube: string | null;
  foto: string | null;
  status: string;
}

export interface InfluenciadorForm {
  nome: string;
  email: string;
  telefone: string;
  instagram: string;
  tiktok: string;
  linkedin: string;
  youtube: string;
  foto: string;
  status: string;
}

export interface InfluenciadorFiltros {
  status?: string[];
  nome?: string;
  email?: string;
  instagram?: string;
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

const baseService = new BaseService<InfluenciadorDTO>('/influenciadores');

function buildQuery(page: number, size: number, filtros: InfluenciadorFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  if (filtros.nome?.length) query.push(`nome=${filtros.nome}`);
  if (filtros.email?.length) query.push(`email=${filtros.email}`);
  if (filtros.instagram?.length) query.push(`instagram=${filtros.instagram}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  return query;
}

export const influenciadorService = {
  listar: (page: number, size: number, filtros: InfluenciadorFiltros): Promise<PaginatedResponse<InfluenciadorDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<Influenciador> =>
    baseService.getById(id) as Promise<Influenciador>,

  salvar: (data: Partial<InfluenciadorForm>) =>
    baseService.create(data),

  atualizar: (id: string, data: Partial<InfluenciadorForm>) =>
    baseService.update(id, data),

  desativar: (id: string) =>
    baseService.desativar(id),

  restaurar: (id: string) =>
    baseService.restaurar(id),

  excluir: (id: string) =>
    baseService.remove(id),

  historico: (id: string) =>
    baseService.getHistorico(id),
};
