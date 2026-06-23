import BaseService, { PaginatedResponse } from '../../services/baseService';
import api from '../../services/api';

export interface MidiaKitTemplateDTO {
  id: string;
  nome: string;
  influenciadorNome: string | null;
  status: string;
  qtdSessoes: number;
}

export interface InfluenciadorRef {
  id: string;
  nome: string;
  email?: string;
  telefone?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  discord?: string | null;
  nicho?: string | null;
  subnicho?: string | null;
  foto?: string | null;
}

export interface Sessao {
  id?: string;
  tipo: string;
  ordem: number;
  titulo?: string;
  ativa?: boolean;
  conteudo?: string;
  analyticsJson?: string | null;
  /** JSON array de data URLs (string) ou null. */
  fotos?: string | null;
  /** JSON estruturado por tipo (redes da capa, links das fotos, comando, contatos). */
  config?: string | null;
}

export interface RedeCapa {
  rede: string;
  mostrar: boolean;
  handle: string;
  seguidores: string;
  url: string;
}

export interface SessaoConfig {
  redes?: RedeCapa[];
  links?: string[];
  comando?: string;
  email?: string;
  mostrarEmail?: boolean;
  whatsapp?: string;
  mostrarWhatsapp?: boolean;
}

export interface MidiaKitTemplate {
  id: string;
  nome: string;
  influenciador: InfluenciadorRef | null;
  status: string;
  sessoes: Sessao[];
}

export interface MidiaKitForm {
  nome: string;
  influenciador: { id: string } | null;
  status: string;
  sessoes: Sessao[];
}

export interface MidiaKitFiltros {
  status?: string[];
  nome?: string;
  influenciador?: string;
  criadoPor?: string;
  registroDe?: string;
  registroAte?: string;
  textoDeBusca?: string;
  mostrarInativos?: boolean;
}

export interface TipoSessaoDef {
  tipo: string;
  label: string;
  requerPrint: boolean;
}

export const TIPOS_SESSAO: TipoSessaoDef[] = [
  { tipo: 'CAPA', label: 'Capa', requerPrint: false },
  { tipo: 'SOBRE_INFLUENCIADOR', label: 'Sobre o influenciador', requerPrint: false },
  { tipo: 'CONTEUDOS', label: 'Conteúdos', requerPrint: true },
  { tipo: 'INSIGHTS_INSTAGRAM', label: 'Insights — Instagram', requerPrint: true },
  { tipo: 'INSIGHTS_TIKTOK', label: 'Insights — TikTok', requerPrint: true },
  { tipo: 'INSIGHTS_YOUTUBE', label: 'Insights — YouTube', requerPrint: true },
  { tipo: 'MARCAS', label: 'Marcas que já trabalhou', requerPrint: false },
  { tipo: 'EXEMPLOS_PUBLIS', label: 'Exemplos de publis', requerPrint: false },
  { tipo: 'CONTATO', label: 'Contato', requerPrint: false },
];

export function labelTipo(tipo: string): string {
  return TIPOS_SESSAO.find((t) => t.tipo === tipo)?.label ?? tipo;
}

export function requerPrint(tipo: string): boolean {
  return TIPOS_SESSAO.find((t) => t.tipo === tipo)?.requerPrint ?? false;
}

export const REDES_CAPA = [
  { rede: 'INSTAGRAM', label: 'Instagram', base: 'https://instagram.com/' },
  { rede: 'TIKTOK', label: 'TikTok', base: 'https://tiktok.com/@' },
  { rede: 'YOUTUBE', label: 'YouTube', base: 'https://youtube.com/@' },
  { rede: 'LINKEDIN', label: 'LinkedIn', base: 'https://linkedin.com/in/' },
  { rede: 'DISCORD', label: 'Discord', base: '' },
];

export function urlRede(rede: string, handle: string): string {
  const h = (handle ?? '').trim();
  if (!h) return '';
  if (/^https?:\/\//.test(h)) return h;
  const def = REDES_CAPA.find((r) => r.rede === rede);
  return (def?.base ?? '') + h.replace(/^@/, '');
}

export function parseConfig(config?: string | null): SessaoConfig {
  if (!config) return {};
  try {
    const o = JSON.parse(config);
    return o && typeof o === 'object' ? (o as SessaoConfig) : {};
  } catch {
    return {};
  }
}

export function conteudoPadrao(tipo: string): string {
  switch (tipo) {
    case 'CONTEUDOS': return 'Clique nas imagens para assistir aos vídeos.';
    case 'MARCAS': return 'Algumas marcas com quem o creator já trabalhou.';
    case 'EXEMPLOS_PUBLIS': return 'Exemplos de publis entregues.';
    case 'CONTATO': return 'Para negociações, fale com a assessoria.';
    default: return '';
  }
}

/** Título "pronto" por tipo (fonte única — o PDF não anexa mais palavras). */
export function tituloPadrao(tipo: string, influ?: InfluenciadorRef | null): string {
  const primeiroNome = influ?.nome?.split(' ')[0] ?? '';
  switch (tipo) {
    case 'CAPA': return '';
    case 'SOBRE_INFLUENCIADOR': return primeiroNome ? `Sobre ${primeiroNome}` : 'Sobre o influenciador';
    case 'CONTEUDOS': return 'Conteúdos recentes';
    case 'INSIGHTS_INSTAGRAM': return 'Insights — Instagram';
    case 'INSIGHTS_TIKTOK': return 'Insights — TikTok';
    case 'INSIGHTS_YOUTUBE': return 'Insights — YouTube';
    case 'MARCAS': return 'Marcas que já trabalhou';
    case 'EXEMPLOS_PUBLIS': return 'Exemplos de publis';
    case 'CONTATO': return 'E aí, bora fazer um feat?';
    default: return labelTipo(tipo);
  }
}

/** Formata valores numéricos grandes (842000 → "842 mil", 1838725 → "1,8 Mi"); mantém % e strings. */
export function formatarValor(v: unknown): string {
  if (typeof v === 'boolean' || v == null) return String(v);
  const s = String(v).trim();
  if (s.includes('%')) return s;
  const num = Number(s.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(num) || s === '' || /[a-zA-Z]/.test(s)) return s;
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.', ',')} Mi`;
  if (abs >= 1_000) return `${Math.round(num / 1_000)} mil`;
  return s;
}

/** Garante URL absoluta (PDF abre no navegador). */
export function garantirUrl(u?: string | null): string {
  const s = (u ?? '').trim();
  if (!s) return '';
  return /^https?:\/\//.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
}

export function configPadrao(tipo: string, influ?: InfluenciadorRef | null): SessaoConfig {
  if (tipo === 'CAPA') {
    const redes: RedeCapa[] = REDES_CAPA.map((r) => {
      const handle = (influ?.[r.rede.toLowerCase() as keyof InfluenciadorRef] as string) ?? '';
      return { rede: r.rede, mostrar: !!handle, handle: handle ?? '', seguidores: '', url: handle ? urlRede(r.rede, handle) : '' };
    });
    return { redes };
  }
  if (tipo === 'CONTATO') {
    return { email: influ?.email ?? '', mostrarEmail: true, whatsapp: influ?.telefone ?? '', mostrarWhatsapp: true };
  }
  if (tipo.startsWith('INSIGHTS_')) return { comando: '' };
  return {};
}

export function sessoesPadrao(influ?: InfluenciadorRef | null): Sessao[] {
  return TIPOS_SESSAO.map((t, i) => ({
    tipo: t.tipo,
    ordem: i,
    titulo: tituloPadrao(t.tipo, influ),
    ativa: true,
    conteudo: conteudoPadrao(t.tipo),
    config: JSON.stringify(configPadrao(t.tipo, influ)),
  }));
}

/** Preenche config de CAPA/CONTATO e título do SOBRE com dados do influenciador onde ainda vazio. */
export function semearInfluenciador(sessoes: Sessao[], influ: InfluenciadorRef): Sessao[] {
  return sessoes.map((s) => {
    if (s.tipo === 'SOBRE_INFLUENCIADOR') {
      const generico = !s.titulo || s.titulo.trim() === '' || s.titulo === 'Sobre o influenciador';
      return generico ? { ...s, titulo: tituloPadrao('SOBRE_INFLUENCIADOR', influ) } : s;
    }
    if (s.tipo !== 'CAPA' && s.tipo !== 'CONTATO') return s;
    const atual = parseConfig(s.config);
    if (s.tipo === 'CAPA') {
      const redes = (atual.redes && atual.redes.length ? atual.redes : (configPadrao('CAPA', influ).redes ?? [])).map((r) => {
        const handle = (influ[r.rede.toLowerCase() as keyof InfluenciadorRef] as string) ?? r.handle;
        const handleFinal = r.handle || handle || '';
        return { ...r, handle: handleFinal, url: r.url || (handleFinal ? urlRede(r.rede, handleFinal) : ''), mostrar: r.mostrar ?? !!handleFinal };
      });
      return { ...s, config: JSON.stringify({ ...atual, redes }) };
    }
    return { ...s, config: JSON.stringify({
      email: atual.email || influ.email || '',
      mostrarEmail: atual.mostrarEmail ?? true,
      whatsapp: atual.whatsapp || influ.telefone || '',
      mostrarWhatsapp: atual.mostrarWhatsapp ?? true,
    }) };
  });
}

/** Compacta uma imagem para data URL JPEG (reduz payload guardado no template). */
export function comprimirImagem(file: File, maxLado = 900, qualidade = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function parseFotos(fotos?: string | null): string[] {
  if (!fotos) return [];
  try {
    const arr = JSON.parse(fotos);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const baseService = new BaseService<MidiaKitTemplateDTO>('/midiakit-templates');

function buildQuery(page: number, size: number, filtros: MidiaKitFiltros): string[] {
  const query: string[] = [`page=${page}`, `size=${size}`];
  if (filtros.textoDeBusca?.length) query.push(`textoDeBusca=${filtros.textoDeBusca}`);
  if (filtros.status?.length) {
    query.push(`status=${filtros.status.join(',')}`);
  } else if (filtros.mostrarInativos) {
    query.push('status=ATIVO,INATIVO');
  }
  if (filtros.nome?.length) query.push(`nome=${filtros.nome}`);
  if (filtros.influenciador?.length) query.push(`influenciador=${filtros.influenciador}`);
  if (filtros.criadoPor?.length) query.push(`criadoPor=${filtros.criadoPor}`);
  if (filtros.registroDe) query.push(`registroDe=${filtros.registroDe}`);
  if (filtros.registroAte) query.push(`registroAte=${filtros.registroAte}`);
  return query;
}

export const midiaKitService = {
  listar: (page: number, size: number, filtros: MidiaKitFiltros): Promise<PaginatedResponse<MidiaKitTemplateDTO>> =>
    baseService.getPage(buildQuery(page, size, filtros)),

  buscar: (id: string): Promise<MidiaKitTemplate> =>
    baseService.getById(id) as Promise<MidiaKitTemplate>,

  salvar: (data: MidiaKitForm) => baseService.create(data),

  atualizar: (id: string, data: MidiaKitForm) => baseService.update(id, data),

  desativar: (id: string) => baseService.desativar(id),

  restaurar: (id: string) => baseService.restaurar(id),

  excluir: (id: string) => baseService.remove(id),

  historico: (id: string) => baseService.getHistorico(id),

  copiar: async (id: string, novoInfluenciadorId?: string): Promise<MidiaKitTemplate> => {
    const response = await api.post<MidiaKitTemplate>(`/midiakit-templates/${id}/copiar`, { novoInfluenciadorId });
    return response.data;
  },

  analisarPrints: async (templateId: string, sessaoId: string, arquivos: File[], comando?: string): Promise<Sessao> => {
    const formData = new FormData();
    arquivos.forEach((f) => formData.append('prints', f));
    if (comando && comando.trim()) formData.append('comando', comando.trim());
    const response = await api.post<Sessao>(
      `/midiakit-templates/${templateId}/sessoes/${sessaoId}/analisar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  listarInfluenciadores: async (): Promise<InfluenciadorRef[]> => {
    const response = await api.get<InfluenciadorRef[]>('/influenciadores/ativos');
    return response.data;
  },
};
