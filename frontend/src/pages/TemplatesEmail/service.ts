import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export type TipoTemplateEmail = 'PROSPECAO' | 'FOLLOW_UP';

export const TIPO_TEMPLATE_LABEL: Record<TipoTemplateEmail, string> = {
  PROSPECAO: 'Prospecção',
  FOLLOW_UP: 'Follow-up',
};

/** Variáveis disponíveis nos templates (token {{chave}}), substituídas pelos dados da prospecção. */
export const VARIAVEIS_TEMPLATE: Array<{ token: string; label: string }> = [
  { token: '{{influenciador}}', label: 'Influenciador' },
  { token: '{{nicho}}', label: 'Nicho' },
  { token: '{{marca}}', label: 'Marca' },
  { token: '{{contato}}', label: 'Contato' },
  { token: '{{tipo}}', label: 'Tipo' },
  { token: '{{data_contato}}', label: 'Data contato' },
  { token: '{{valor_proposto}}', label: 'Valor proposto' },
  { token: '{{valor_aceito}}', label: 'Valor aceito' },
  { token: '{{valor_contraproposto}}', label: 'Contraproposta' },
];

export interface TemplateEmailDTO {
  id: string;
  nome: string;
  tipo: TipoTemplateEmail;
  assunto: string;
  padrao: boolean;
  status: string;
}

export interface TemplateEmail {
  id: string;
  nome: string;
  tipo: TipoTemplateEmail;
  assunto: string;
  corpo: string;
  padrao: boolean;
  status: string;
}

export interface TemplateEmailForm {
  nome: string;
  tipo: TipoTemplateEmail;
  assunto: string;
  corpo: string;
  padrao: boolean;
  status: string;
}

export interface TemplateEmailFiltros {
  nome?: string;
  tipo?: string[];
  status?: string[];
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

export interface RenderTemplate {
  assunto: string;
  corpo: string;
}

const baseService = new BaseService<TemplateEmailDTO>('/templates-email');

function buildQuery(page: number, size: number, filtros: TemplateEmailFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.nome?.length) query.push(`nome=${filtros.nome}`);
  if (filtros.tipo?.length) query.push(`tipo=${filtros.tipo.join(',')}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  return query;
}

export const templateEmailService = {
  listar: (page: number, size: number, filtros: TemplateEmailFiltros): Promise<PaginatedResponse<TemplateEmailDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<TemplateEmail> => baseService.getById(id) as Promise<TemplateEmail>,

  salvar: (data: TemplateEmailForm) => baseService.create(data as unknown as Partial<TemplateEmailDTO>),

  atualizar: (id: string, data: TemplateEmailForm) => baseService.update(id, data as unknown as Partial<TemplateEmailDTO>),

  desativar: (id: string) => baseService.desativar(id),
  restaurar: (id: string) => baseService.restaurar(id),
  excluir: (id: string) => baseService.remove(id),
  historico: (id: string) => baseService.getHistorico(id),

  listarPorTipo: async (tipo: TipoTemplateEmail): Promise<TemplateEmail[]> => {
    const r = await api.get<TemplateEmail[]>(`/templates-email/por-tipo/${tipo}`);
    return r.data;
  },

  render: async (id: string, prospecaoId: string): Promise<RenderTemplate> => {
    const r = await api.get<RenderTemplate>(`/templates-email/${id}/render`, { params: { prospecaoId } });
    return r.data;
  },
};
