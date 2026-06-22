import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  status: string;
  perfis: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  status: string;
  perfis: Perfil[];
}

export interface Perfil {
  id: string;
  descricao: string;
  status: string;
  roles: string[];
}

export interface UsuarioForm {
  nome: string;
  email: string;
  senha: string;
  status: string;
  perfis: Perfil[];
}

export interface UsuarioFiltros {
  status?: string[];
  perfil?: string[];
  nome?: string;
  email?: string;
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  modificacaoDe?: string;
  modificacaoAte?: string;
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

const baseService = new BaseService<UsuarioDTO>('/usuarios');

function buildQuery(page: number, size: number, filtros: UsuarioFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  if (filtros.perfil?.length) query.push(`perfil=${filtros.perfil.join(',')}`);
  if (filtros.nome?.length) query.push(`nome=${filtros.nome}`);
  if (filtros.email?.length) query.push(`email=${filtros.email}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  if (filtros.modificacaoDe) query.push(`modificacaoDe=${filtros.modificacaoDe}`);
  if (filtros.modificacaoAte) query.push(`modificacaoAte=${filtros.modificacaoAte}`);
  return query;
}

export const usuarioService = {
  listar: (page: number, size: number, filtros: UsuarioFiltros): Promise<PaginatedResponse<UsuarioDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<Usuario> =>
    baseService.getById(id) as Promise<Usuario>,

  salvar: (data: Partial<UsuarioForm>) =>
    baseService.create(data),

  atualizar: (id: string, data: Partial<UsuarioForm>) =>
    baseService.update(id, data),

  desativar: (id: string) =>
    baseService.desativar(id),

  restaurar: (id: string) =>
    baseService.restaurar(id),

  excluir: (id: string) =>
    baseService.remove(id),

  historico: (id: string) =>
    baseService.getHistorico(id),

  listarPerfis: async (): Promise<Perfil[]> => {
    const response = await api.get<Perfil[]>('/perfis/ativos');
    return response.data;
  },
};
