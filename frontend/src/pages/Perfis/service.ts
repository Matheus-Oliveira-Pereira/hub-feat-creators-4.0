import BaseService, { PaginatedResponse } from '../../services/baseService';

export interface PerfilDTO {
  id: string;
  descricao: string;
  status: string;
  roles: string[];
  totalA: number;
  totalB: number;
  totalC: number;
  totalD: number;
}

export interface Perfil {
  id: string;
  descricao: string;
  status: string;
  roles: string[];
}

export interface PerfilForm {
  descricao: string;
  status: string;
  roles: string[];
}

export interface PerfilFiltros {
  status?: string[];
  descricao?: string;
  role?: string[];
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

const baseService = new BaseService<PerfilDTO>('/perfis');

function buildQuery(page: number, size: number, filtros: PerfilFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  if (filtros.descricao?.length) query.push(`descricao=${filtros.descricao}`);
  if (filtros.role?.length) query.push(`role=${filtros.role.join(',')}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  return query;
}

export const perfilService = {
  listar: (page: number, size: number, filtros: PerfilFiltros): Promise<PaginatedResponse<PerfilDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<Perfil> =>
    baseService.getById(id) as Promise<Perfil>,

  salvar: (data: Partial<PerfilForm>) =>
    baseService.create(data),

  atualizar: (id: string, data: Partial<PerfilForm>) =>
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
