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
  /** Estética opcional da seção; campos vazios usam o padrão do template. */
  estetica?: EsteticaSessao | null;
}

/** Estética opcional de uma seção. Todo campo vazio/undefined = usa o padrão. */
export interface EsteticaSessao {
  corFundo?: string | null;
  corDestaque?: string | null;
  corTexto?: string | null;
  corTextoSecundario?: string | null;
  corCard?: string | null;
  corBorda?: string | null;
  fonteTitulo?: string | null;
  tamanhoNomeCapa?: number | null;
  tamanhoTitulo?: number | null;
  tamanhoTexto?: number | null;
  paddingPagina?: number | null;
  alturaPagina?: number | null;
  gapCards?: number | null;
  raioBorda?: number | null;
  /** Escala das fotos da seção em % (100 = padrão). */
  escalaFotos?: number | null;
  alinhamentoTitulo?: string | null;
  alinhamentoConteudo?: string | null;
}

/** Valores padrão da estética — fonte única usada pelo PDF (tema) e pelo EsteticaDialog (placeholders). */
export const ESTETICA_PADRAO = {
  corFundo: '#0a0a0a',
  corDestaque: '#C2E000',
  corTexto: '#f5f5f5',
  corTextoSecundario: '#9ca3af',
  corCard: '#1a1a1a',
  corBorda: '#3d3d3d',
  fonteTitulo: 'Heading',
  tamanhoNomeCapa: 56,
  tamanhoTitulo: 40,
  tamanhoTexto: 13,
  paddingPagina: 40,
  alturaPagina: 500,
  gapCards: 12,
  raioBorda: 14,
  escalaFotos: 100,
  alinhamentoTitulo: 'left',
  alinhamentoConteudo: 'left',
} as const;

/** Presets de tema aplicáveis ao template inteiro (estetica=null volta ao padrão dark/lime). */
export const TEMAS_TEMPLATE: { nome: string; estetica: EsteticaSessao | null }[] = [
  { nome: 'Padrão (dark/lime)', estetica: null },
  {
    nome: 'Claro',
    estetica: {
      corFundo: '#ffffff', corCard: '#f3f4f6', corDestaque: '#16a34a',
      corTexto: '#111827', corTextoSecundario: '#6b7280', corBorda: '#e5e7eb',
    },
  },
  {
    nome: 'Azul noite',
    estetica: {
      corFundo: '#0b1220', corCard: '#131f38', corDestaque: '#38bdf8',
      corTexto: '#f1f5f9', corTextoSecundario: '#94a3b8', corBorda: '#27395e',
    },
  },
  {
    nome: 'Roxo',
    estetica: {
      corFundo: '#150022', corCard: '#241238', corDestaque: '#c084fc',
      corTexto: '#faf5ff', corTextoSecundario: '#a78bfa', corBorda: '#3b2757',
    },
  },
];

export interface RedeCapa {
  rede: string;
  mostrar: boolean;
  handle: string;
  seguidores: string;
  url: string;
}

export interface MarcaRef {
  id: string;
  nome: string;
  logotipo?: string | null;
}

export interface SessaoConfig {
  redes?: RedeCapa[];
  links?: string[];
  comando?: string;
  email?: string;
  mostrarEmail?: boolean;
  whatsapp?: string;
  mostrarWhatsapp?: boolean;
  /** Snapshot das marcas cadastradas selecionadas na seção MARCAS. */
  marcas?: MarcaRef[];
  /** Link para baixar os prints originais (seções de insights). */
  linkPrints?: string;
  /** Layout das fotos (CONTEUDOS/EXEMPLOS_PUBLIS): VERTICAL | HORIZONTAL | QUADRADO | HIBRIDO. */
  layoutFotos?: string;
  /** Formato por foto quando layoutFotos = HIBRIDO (índice casa com o array de fotos). */
  formatosFotos?: string[];
  /** Nome exibido na capa (independente do cadastro do influenciador). */
  nomeCapa?: string;
  /** ISO da última extração de analytics (exibido no editor). */
  analisadoEm?: string;
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
  { tipo: 'CONTEUDOS', label: 'Conteúdos', requerPrint: false },
  { tipo: 'INSIGHTS_INSTAGRAM', label: 'Insights — Instagram', requerPrint: true },
  { tipo: 'INSIGHTS_TIKTOK', label: 'Insights — TikTok', requerPrint: true },
  { tipo: 'INSIGHTS_YOUTUBE', label: 'Insights — YouTube', requerPrint: true },
  { tipo: 'INSIGHTS_LINKEDIN', label: 'Insights — LinkedIn', requerPrint: true },
  { tipo: 'INSIGHTS_LINKEDIN_NEWSLETTER', label: 'Insights — Newsletter LinkedIn', requerPrint: true },
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

/** Formato de foto nas seções de conteúdo. */
export type FormatoFoto = 'VERTICAL' | 'HORIZONTAL' | 'QUADRADO';

export const FORMATOS_FOTO: { valor: FormatoFoto; label: string }[] = [
  { valor: 'VERTICAL', label: 'Vertical (9:16)' },
  { valor: 'HORIZONTAL', label: 'Horizontal (16:9)' },
  { valor: 'QUADRADO', label: 'Quadrado (1:1)' },
];

/** Layouts das seções CONTEUDOS/EXEMPLOS_PUBLIS. HIBRIDO = formato escolhido por foto. */
export const LAYOUTS_FOTOS: { valor: string; label: string }[] = [
  { valor: 'VERTICAL', label: 'Vertical (9:16) — Reels/TikTok' },
  { valor: 'HORIZONTAL', label: 'Horizontal (16:9) — YouTube' },
  { valor: 'QUADRADO', label: 'Quadrado (1:1) — feed/LinkedIn' },
  { valor: 'HIBRIDO', label: 'Híbrido — formato por foto' },
];

function normFormato(f?: string | null): FormatoFoto {
  return f === 'HORIZONTAL' || f === 'QUADRADO' ? f : 'VERTICAL';
}

/** Resolve o formato da foto i a partir do layout da seção (HIBRIDO usa formatosFotos[i]). */
export function formatoDaFoto(config: SessaoConfig, i: number): FormatoFoto {
  const layout = config.layoutFotos ?? 'VERTICAL';
  if (layout === 'HIBRIDO') return normFormato(config.formatosFotos?.[i]);
  return normFormato(layout);
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
    case 'INSIGHTS_LINKEDIN': return 'Insights — LinkedIn';
    case 'INSIGHTS_LINKEDIN_NEWSLETTER': return 'Insights — Newsletter LinkedIn';
    case 'MARCAS': return 'Marcas que já trabalhou';
    case 'EXEMPLOS_PUBLIS': return 'Exemplos de publis';
    case 'CONTATO': return 'E aí, bora fazer um feat?';
    default: return labelTipo(tipo);
  }
}

/** Formata valores numéricos grandes (842000 → "842 Mil", 1838725 → "1,8 Milhão"); mantém % e strings.
 *  Expande sufixos abreviados (842K → 842000, 1.8M → 1800000) p/ nunca exibir "K". */
export function formatarValor(v: unknown): string {
  if (typeof v === 'boolean' || v == null) return String(v);
  let s = String(v).trim();
  if (s.includes('%')) return s;
  // Sufixos K/M/mil/mi → expande para número antes de formatar (insights nunca mostram "K").
  const suf = /^([\d.,]+)\s*(k|mil|m|mi|mm)\b/i.exec(s);
  if (suf) {
    const n = Number(suf[1].replace(',', '.'));
    if (Number.isFinite(n)) {
      const mult = /^(k|mil)$/i.test(suf[2]) ? 1_000 : 1_000_000;
      s = String(n * mult);
    }
  }
  const num = Number(s.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(num) || s === '' || /[a-zA-Z]/.test(s)) return s;
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const x = num / 1_000_000;
    const unidade = Math.floor(Math.abs(x)) >= 2 ? 'Milhões' : 'Milhão';
    return `${x.toFixed(1).replace('.', ',')} ${unidade}`;
  }
  if (abs >= 1_000) return `${Math.round(num / 1_000)} Mil`;
  return s;
}

/** Dicionário ascii→acentuado (pt-BR) para rótulos/nomes vindos de chaves snake_case sem acento. */
const PT_ACENTOS: Record<string, string> = {
  // métricas / demografia
  visualizacoes: 'visualizações', visualizacao: 'visualização', interacoes: 'interações', interacao: 'interação',
  impressoes: 'impressões', impressao: 'impressão', inscricoes: 'inscrições', inscricao: 'inscrição',
  comentarios: 'comentários', comentario: 'comentário', reacoes: 'reações', genero: 'gênero',
  etaria: 'etária', etario: 'etário', periodo: 'período', regiao: 'região', regioes: 'regiões', pais: 'país',
  publico: 'público', audiencia: 'audiência', medio: 'médio', media: 'média', exibicao: 'exibição',
  video: 'vídeo', videos: 'vídeos', conteudo: 'conteúdo', conteudos: 'conteúdos', metricas: 'métricas',
  metrica: 'métrica', usuarios: 'usuários', usuario: 'usuário', numero: 'número', demografico: 'demográfico',
  demograficos: 'demográficos',
  // cidades / nomes próprios comuns
  sao: 'são', luis: 'luís', jose: 'josé', joao: 'joão', andre: 'andré', goncalo: 'gonçalo',
  brasilia: 'brasília', goiania: 'goiânia', belem: 'belém', vitoria: 'vitória', maceio: 'maceió',
  florianopolis: 'florianópolis', cuiaba: 'cuiabá', macapa: 'macapá', niteroi: 'niterói',
  guaruja: 'guarujá', maua: 'mauá', ribeirao: 'ribeirão', petropolis: 'petrópolis', uberlandia: 'uberlândia',
  maringa: 'maringá', anapolis: 'anápolis', jundiai: 'jundiaí',
};
const PT_CONECTORES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** Rótulo pt-BR a partir de uma chave (snake_case/espaços): aplica acentos conhecidos e capitaliza. */
export function rotularPt(chave: string): string {
  const palavras = chave.split(/[\s_]+/).filter(Boolean);
  return palavras.map((w, i) => {
    const low = w.toLowerCase();
    const base = PT_ACENTOS[low] ?? w;
    if (i > 0 && PT_CONECTORES.has(base.toLowerCase())) return base.toLowerCase();
    return base.charAt(0).toUpperCase() + base.slice(1);
  }).join(' ');
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
    return { redes, nomeCapa: influ?.nome ?? '' };
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
      return { ...s, config: JSON.stringify({ ...atual, redes, nomeCapa: atual.nomeCapa || influ.nome || '' }) };
    }
    return { ...s, config: JSON.stringify({
      email: atual.email || influ.email || '',
      mostrarEmail: atual.mostrarEmail ?? true,
      whatsapp: atual.whatsapp || influ.telefone || '',
      mostrarWhatsapp: atual.mostrarWhatsapp ?? true,
    }) };
  });
}

// comprimirImagem extraída p/ utils/imagem.ts (reuso em Marcas); reexportada p/ não quebrar imports.
export { comprimirImagem } from '../../utils/imagem';

export function parseFotos(fotos?: string | null): string[] {
  if (!fotos) return [];
  try {
    const arr = JSON.parse(fotos);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Tipos preenchidos automaticamente a partir do influenciador (não exigem conteúdo próprio). */
export const TIPOS_AUTO = ['CAPA', 'CONTATO'];

/** Seção sem nenhum conteúdo (texto, foto ou analytics); CAPA/CONTATO são isentos. */
export function sessaoVazia(s: Sessao): boolean {
  if (TIPOS_AUTO.includes(s.tipo)) return false;
  const temFoto = parseFotos(s.fotos).length > 0;
  const temTexto = !!s.conteudo && s.conteudo.trim().length > 0;
  const temAnalytics = !!s.analyticsJson && s.analyticsJson.trim().length > 0;
  return !temFoto && !temTexto && !temAnalytics;
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
    baseService.getById(id) as unknown as Promise<MidiaKitTemplate>,

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

  listarMarcas: async (): Promise<MarcaRef[]> => {
    const response = await api.get<MarcaRef[]>('/marcas/ativos');
    return response.data;
  },
};
