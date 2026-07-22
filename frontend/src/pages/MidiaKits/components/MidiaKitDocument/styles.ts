import { Font, StyleSheet } from '@react-pdf/renderer';
import { Sessao, EsteticaSessao, FormatoFoto, ESTETICA_PADRAO } from '../../service';
import archivoBlackUrl from '../../../../assets/fonts/ArchivoBlack-Regular.ttf';

// Fonte de títulos (grotesca pesada) embutida no bundle — sem dependência de rede na exportação.
Font.register({
  family: 'Heading',
  src: archivoBlackUrl,
});
const HEADING = 'Heading';

export const ANO = new Date().getFullYear();

// Texto claro secundário (corpo do "Sobre" / pills de público). Não é temável.
const SOFT = '#d1d5db';

export type Align = 'left' | 'center' | 'right';

/** Tema resolvido de uma seção (estética da seção sobre os padrões). */
export interface Tema {
  bg: string;
  card: string;
  lime: string;
  text: string;
  muted: string;
  border: string;
  fonteTitulo: string;
  tamNomeCapa: number;
  tamTitulo: number;
  tamTexto: number;
  padding: number;
  gap: number;
  raio: number;
  escala: number;
  alinhTitulo: Align;
  alinhConteudo: Align;
  alturaPagina: number | null;
}

// Derivado de ESTETICA_PADRAO (fonte única compartilhada com o EsteticaDialog).
export const TEMA_PADRAO: Tema = {
  bg: ESTETICA_PADRAO.corFundo,
  card: ESTETICA_PADRAO.corCard,
  lime: ESTETICA_PADRAO.corDestaque,
  text: ESTETICA_PADRAO.corTexto,
  muted: ESTETICA_PADRAO.corTextoSecundario,
  border: ESTETICA_PADRAO.corBorda,
  fonteTitulo: HEADING,
  tamNomeCapa: ESTETICA_PADRAO.tamanhoNomeCapa,
  tamTitulo: ESTETICA_PADRAO.tamanhoTitulo,
  tamTexto: ESTETICA_PADRAO.tamanhoTexto,
  padding: ESTETICA_PADRAO.paddingPagina,
  gap: ESTETICA_PADRAO.gapCards,
  raio: ESTETICA_PADRAO.raioBorda,
  escala: 1,
  alinhTitulo: 'left',
  alinhConteudo: 'left',
  alturaPagina: null,
};

// Altura-base por tipo; a estética da seção pode sobrescrever.
export const PAGE_W = 842;
const ALTURA_PAGINA: Record<string, number> = {
  CAPA: 540,
  INSIGHTS_INSTAGRAM: 660,
  INSIGHTS_TIKTOK: 660,
  INSIGHTS_YOUTUBE: 660,
  INSIGHTS_LINKEDIN: 660,
  INSIGHTS_LINKEDIN_NEWSLETTER: 660,
};

// Dimensões-base das fotos de conteúdo por formato (escala da seção multiplica).
export const DIM_FORMATO: Record<FormatoFoto, { w: number; h: number }> = {
  VERTICAL: { w: 150, h: 250 },
  HORIZONTAL: { w: 240, h: 135 },
  QUADRADO: { w: 180, h: 180 },
};

function normAlign(a?: string | null): Align {
  return a === 'center' || a === 'right' ? a : 'left';
}
function flexAlign(a: Align): 'flex-start' | 'center' | 'flex-end' {
  return a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start';
}

/** Faz merge da estética da seção sobre os padrões (campos vazios usam o padrão). */
export function resolverEstetica(sessao: Sessao): Tema {
  const e: EsteticaSessao = sessao.estetica ?? {};
  const d = TEMA_PADRAO;
  return {
    bg: e.corFundo || d.bg,
    card: e.corCard || d.card,
    lime: e.corDestaque || d.lime,
    text: e.corTexto || d.text,
    muted: e.corTextoSecundario || d.muted,
    border: e.corBorda || d.border,
    fonteTitulo: e.fonteTitulo || d.fonteTitulo,
    tamNomeCapa: e.tamanhoNomeCapa ?? d.tamNomeCapa,
    tamTitulo: e.tamanhoTitulo ?? d.tamTitulo,
    tamTexto: e.tamanhoTexto ?? d.tamTexto,
    padding: e.paddingPagina ?? d.padding,
    gap: e.gapCards ?? d.gap,
    raio: e.raioBorda ?? d.raio,
    escala: (e.escalaFotos ?? 100) / 100,
    alinhTitulo: normAlign(e.alinhamentoTitulo),
    alinhConteudo: normAlign(e.alinhamentoConteudo),
    alturaPagina: e.alturaPagina ?? null,
  };
}

export function alturaPagina(tipo: string, tema: Tema): number {
  return tema.alturaPagina ?? ALTURA_PAGINA[tipo] ?? 500;
}

/** Cria o StyleSheet da seção a partir do tema resolvido. */
export function criarStyles(t: Tema) {
  const alTit = flexAlign(t.alinhTitulo);
  const alCont = flexAlign(t.alinhConteudo);
  const k = t.escala;
  return StyleSheet.create({
    page: { backgroundColor: t.bg, color: t.text, padding: t.padding, fontFamily: 'Helvetica', fontSize: 11 },
    topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    logo: { width: 134, height: 36, objectFit: 'contain' },
    topRight: { fontSize: 8, color: t.muted, letterSpacing: 1, textTransform: 'uppercase' },

    titulo: { fontSize: t.tamTitulo, fontFamily: t.fonteTitulo, color: t.text, textAlign: t.alinhTitulo },
    tituloLime: { color: t.lime },
    subtitulo: { fontSize: 11.5, color: t.muted, marginTop: 12, marginBottom: 18, textAlign: t.alinhConteudo },

    // Capa
    capaBody: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 10 },
    capaMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexGrow: 1 },
    capaInfo: { flex: 1, paddingRight: 24 },
    capaLabel: { fontSize: 10, color: t.lime, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, fontFamily: 'Helvetica-Bold' },
    capaNome: { fontSize: t.tamNomeCapa, fontFamily: t.fonteTitulo, color: t.text, lineHeight: 1.05 },
    capaNicho: { fontSize: 12, color: t.lime, marginTop: 16 },
    // Raio externo = raio da foto + padding (senão a foto cobre a borda nos cantos/lados).
    capaFotoFrame: { backgroundColor: t.lime, borderRadius: 13, padding: 3, alignSelf: 'center', flexShrink: 0 },
    capaFoto: { width: 212 * k, height: 212 * k, borderRadius: 10, objectFit: 'cover' },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8, maxWidth: '52%' },
    pill: { backgroundColor: t.card, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, border: `1 solid ${t.border}`, textDecoration: 'none' },
    pillIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' },
    pillVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: t.lime, textDecoration: 'none' },
    pillNome: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: t.lime, textDecoration: 'none' },

    // Sobre
    sobreCenter: { flexGrow: 1, justifyContent: 'center' },
    sobreWrap: { flexDirection: 'row', gap: 68, alignItems: 'center', marginTop: 30 },
    sobreTexto: { flex: 1, fontSize: t.tamTexto, lineHeight: 1.7, color: SOFT, textAlign: t.alinhConteudo },
    sobreFotoFrame: { backgroundColor: '#9ca3af', borderRadius: 13.5, padding: 2, alignSelf: 'center', flexShrink: 0 },
    sobreFoto: { width: 280 * k, height: 280 * k, borderRadius: 11.5, objectFit: 'cover' },
    paragrafo: { marginBottom: 12 },

    conteudosCenter: { flexGrow: 1, justifyContent: 'center' },
    cardsRow: { flexDirection: 'row', gap: t.gap, flexWrap: 'wrap', alignItems: 'center', justifyContent: alCont },
    conteudoCard: { width: 150 * k, height: 250 * k, borderRadius: t.raio, objectFit: 'cover' },

    insightsCenter: { flexGrow: 1, justifyContent: 'center' },
    insightsHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, justifyContent: alTit },
    secaoHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2, justifyContent: alTit },

    redeHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    redeNome: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: t.lime },

    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.gap, marginBottom: 18, marginTop: 14, justifyContent: alCont },
    metricCard: { backgroundColor: t.card, borderRadius: t.raio, padding: 16, minWidth: 150, flexGrow: 1, border: `1 solid ${t.border}` },
    metricVal: { fontSize: 32, fontFamily: t.fonteTitulo, color: t.lime },
    metricLabel: { fontSize: 11, color: t.muted, marginTop: 4, textTransform: 'capitalize' },

    demoRow: { flexDirection: 'row', gap: t.gap },
    demoPanel: { flex: 1, backgroundColor: t.card, borderRadius: t.raio, padding: 14, border: `1 solid ${t.border}` },
    demoTitulo: { fontSize: 9.5, color: t.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    demoItem: { marginBottom: 7 },
    demoItemHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    demoKey: { fontSize: 10.5, color: t.text, textTransform: 'capitalize' },
    demoVal: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: t.lime },
    barTrack: { height: 4, backgroundColor: '#262626', borderRadius: 2, marginTop: 2 },
    barFill: { height: 4, backgroundColor: t.lime, borderRadius: 2 },
    subGrupo: { marginBottom: 6, marginTop: 2 },
    subGrupoTit: { fontSize: 8, color: t.lime, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

    resumoWrap: { marginTop: 18 },
    resumoTit: { fontSize: 9, color: t.lime, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
    publicoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    publicoPill: { backgroundColor: t.card, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 12, fontSize: 10.5, color: SOFT, border: `1 solid ${t.border}` },

    fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12, justifyContent: alCont },
    fotoItem: { width: 150 * k, height: 150 * k, borderRadius: t.raio, objectFit: 'cover' },

    // Marcas (logos)
    marcasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, justifyContent: alCont },
    marcaCard: { width: 150 * k, backgroundColor: '#f5f5f5', borderRadius: t.raio, padding: 12, alignItems: 'center', border: `1 solid ${t.border}` },
    marcaLogo: { width: 126 * k, height: 90 * k, objectFit: 'contain' },
    marcaNome: { fontSize: 10, color: '#111', fontFamily: 'Helvetica-Bold', marginTop: 8, textAlign: 'center' },

    linkPrints: { fontSize: 10.5, color: t.lime, textDecoration: 'none', marginBottom: 14 },
    linkPrintsUnderline: { textDecoration: 'underline' },

    // Contato
    contatoBody: { flexGrow: 1, justifyContent: 'center' },
    contatoTitulo: { fontSize: 46, fontFamily: t.fonteTitulo, color: t.text, maxWidth: 480, marginBottom: 24, lineHeight: 1.1 },
    contatoSub: { fontSize: 12.5, color: t.muted, marginTop: 18 },
    contatoCards: { flexDirection: 'row', justifyContent: 'flex-start', gap: 14 },
    contatoCard: { backgroundColor: t.card, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16, border: `1 solid ${t.border}` },
    contatoLabel: { fontSize: 8, color: t.muted, marginBottom: 6, marginLeft: 21 },
    contatoLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contatoIcone: { width: 14, alignItems: 'center', justifyContent: 'center' },
    contatoVal: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: t.text, lineHeight: 1 },

    rodape: { borderTop: `1 solid ${t.border}`, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rodapeTxt: { fontSize: 8, color: t.muted, maxWidth: 360 },
    rodapeLinks: { flexDirection: 'row', gap: 18, marginLeft: 40 },
    rodapeLink: { fontSize: 8, color: t.lime, textDecoration: 'none' },
  });
}

export type Styles = ReturnType<typeof criarStyles>;

export const stylesPadrao = criarStyles(TEMA_PADRAO);
