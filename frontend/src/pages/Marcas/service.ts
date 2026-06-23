import BaseService, { PaginatedResponse } from '../../services/baseService';

export interface MarcaDTO {
  id: string;
  nome: string;
  status: string;
  qtdContatos: number;
}

export interface Contato {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  ordem?: number;
}

export interface Marca {
  id: string;
  nome: string;
  status: string;
  contatos: Contato[];
}

export interface MarcaForm {
  nome: string;
  status: string;
  contatos: Contato[];
}

export interface MarcaFiltros {
  status?: string[];
  nome?: string;
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

const baseService = new BaseService<MarcaDTO>('/marcas');

function buildQuery(page: number, size: number, filtros: MarcaFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  if (filtros.nome?.length) query.push(`nome=${filtros.nome}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  return query;
}

export const marcaService = {
  listar: (page: number, size: number, filtros: MarcaFiltros): Promise<PaginatedResponse<MarcaDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<Marca> =>
    baseService.getById(id) as Promise<Marca>,

  salvar: (data: MarcaForm) => baseService.create(data),

  atualizar: (id: string, data: MarcaForm) => baseService.update(id, data),

  desativar: (id: string) => baseService.desativar(id),

  restaurar: (id: string) => baseService.restaurar(id),

  excluir: (id: string) => baseService.remove(id),

  historico: (id: string) => baseService.getHistorico(id),
};

/** Contato é inválido se não tiver nome OU não tiver nenhum meio (email/telefone). Vazio = ignorado. */
export function contatoVazio(c: Contato): boolean {
  return !c.nome.trim() && !c.email.trim() && !c.telefone.trim();
}

export function contatoInvalido(c: Contato): boolean {
  if (contatoVazio(c)) return false;
  return !c.nome.trim() || (!c.email.trim() && !c.telefone.trim());
}
