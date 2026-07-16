import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Link, Font, pdf } from '@react-pdf/renderer';
import { MidiaKitTemplate, Sessao, InfluenciadorRef, RedeCapa, EsteticaSessao, ESTETICA_PADRAO, labelTipo, parseFotos, parseConfig, formatarValor, garantirUrl, rotularPt } from '../../service';
import { SOCIAL_ICONS } from './socialIcons';
import { LOGO_PATHS, LOGO_VIEWBOX } from './logo';
import archivoBlackUrl from '../../../../assets/fonts/ArchivoBlack-Regular.ttf';

// Fonte de títulos (grotesca pesada) embutida no bundle — sem dependência de rede na exportação.
Font.register({
  family: 'Heading',
  src: archivoBlackUrl,
});
const HEADING = 'Heading';

const ANO = new Date().getFullYear();

// Mês/ano de referência (ex.: "Junho/2026") para o título dos insights.
const MES_ANO = (() => {
  const partes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).split(' '); // ["junho","de","2026"]
  const mes = partes[0] ?? '';
  const ano = partes[partes.length - 1] ?? '';
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}/${ano}`;
})();

// Nomenclatura da contagem por rede (após o número, na capa).
const NOME_SEGUIDORES: Record<string, string> = {
  INSTAGRAM: 'seguidores',
  TIKTOK: 'seguidores',
  LINKEDIN: 'seguidores',
  YOUTUBE: 'inscritos',
  DISCORD: 'membros',
};

// Rede + rótulo do head dos insights por tipo de seção.
const TIPO_REDE: Record<string, { rede: string; nome: string }> = {
  INSIGHTS_INSTAGRAM: { rede: 'INSTAGRAM', nome: 'Instagram' },
  INSIGHTS_TIKTOK: { rede: 'TIKTOK', nome: 'TikTok' },
  INSIGHTS_YOUTUBE: { rede: 'YOUTUBE', nome: 'YouTube' },
};

// Texto claro secundário (corpo do "Sobre" / pills de público). Não é temável.
const SOFT = '#d1d5db';

type Align = 'left' | 'center' | 'right';

/** Tema resolvido de uma seção (estética da seção sobre os padrões). */
interface Tema {
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
const TEMA_PADRAO: Tema = {
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
const PAGE_W = 842;
const ALTURA_PAGINA: Record<string, number> = {
  CAPA: 540,
  INSIGHTS_INSTAGRAM: 660,
  INSIGHTS_TIKTOK: 660,
  INSIGHTS_YOUTUBE: 660,
};

function normAlign(a?: string | null): Align {
  return a === 'center' || a === 'right' ? a : 'left';
}
function flexAlign(a: Align): 'flex-start' | 'center' | 'flex-end' {
  return a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start';
}

/** Faz merge da estética da seção sobre os padrões (campos vazios usam o padrão). */
function resolverEstetica(sessao: Sessao): Tema {
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

function alturaPagina(tipo: string, tema: Tema): number {
  return tema.alturaPagina ?? ALTURA_PAGINA[tipo] ?? 500;
}

/** Cria o StyleSheet da seção a partir do tema resolvido. */
function criarStyles(t: Tema) {
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

type Styles = ReturnType<typeof criarStyles>;

const stylesPadrao = criarStyles(TEMA_PADRAO);

function LogoFeat({ tema = TEMA_PADRAO }: Readonly<{ tema?: Tema }>) {
  return (
    <Svg width={134} height={36} viewBox={LOGO_VIEWBOX} style={stylesPadrao.logo}>
      {LOGO_PATHS.map((p) => <Path key={p.d.slice(0, 24)} d={p.d} fill={p.lime ? tema.lime : tema.text} />)}
    </Svg>
  );
}

function IconeRede({ rede, size = 14, color = TEMA_PADRAO.lime }: Readonly<{ rede: string; size?: number; color?: string }>) {
  const d = SOCIAL_ICONS[rede];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} />
    </Svg>
  );
}

function TituloAcento({ texto, styles, base }: Readonly<{ texto: string; styles: Styles; base?: typeof styles.titulo }>) {
  const estilo = base ?? styles.titulo;
  const palavras = (texto ?? '').trim().split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return <Text style={estilo}>{texto}</Text>;
  const ultima = palavras.pop();
  return <Text style={estilo}>{palavras.join(' ')} <Text style={styles.tituloLime}>{ultima}</Text></Text>;
}

function PillRede({ r, styles, tema }: Readonly<{ r: RedeCapa; styles: Styles; tema: Tema }>) {
  const nomenclatura = NOME_SEGUIDORES[r.rede] ?? 'seguidores';
  const inner = (
    <>
      <View style={styles.pillIcon}><IconeRede rede={r.rede} size={11} color={tema.lime} /></View>
      <Text style={styles.pillVal}>{r.seguidores || r.handle}</Text>
      {r.seguidores ? <Text style={styles.pillNome}>{nomenclatura}</Text> : null}
    </>
  );
  if (r.url) return <Link src={garantirUrl(r.url)} style={styles.pill}>{inner}</Link>;
  return <View style={styles.pill}>{inner}</View>;
}

function ehUrl(s?: string | null): boolean {
  return !!s && (/^https?:\/\//.test(s) || s.startsWith('data:image'));
}

/** Aplica máscara de telefone BR; mantém valor cru se não reconhecer o formato. */
function formatarTelefone(v: string): string {
  const d = (v ?? '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  return v;
}

function parseAnalytics(json?: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const o = JSON.parse(json);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function rotular(k: string): string {
  return rotularPt(k);
}

function larguraBarra(v: unknown): string {
  const m = /([\d.,]+)\s*%/.exec(String(v));
  if (!m) return '0%';
  const n = Number.parseFloat(m[1].replace(',', '.'));
  return `${Math.max(0, Math.min(100, n))}%`;
}

function valorPct(v: unknown): number {
  const m = /([\d.,]+)\s*%/.exec(String(v));
  return m ? Number.parseFloat(m[1].replace(',', '.')) : -1;
}

/** Converte valor (número ou string) num número; null se não numérico. */
function valorNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = /-?[\d.,]+/.exec(String(v));
  if (!m) return null;
  const t = m[0].includes(',') ? m[0].replace(/\./g, '').replace(',', '.') : m[0];
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function escalaresDe(obj: Record<string, unknown>): [string, unknown][] {
  return Object.entries(obj).filter(([, v]) => v !== null && typeof v !== 'object' && !Array.isArray(v));
}

/** Converte um array de objetos [{nome, percentual}] num Record { nome: valor } (nomes acentuados). */
function arrayObjParaRecord(arr: unknown[]): Record<string, unknown> | null {
  const rec: Record<string, unknown> = {};
  for (const it of arr) {
    if (!it || typeof it !== 'object' || Array.isArray(it)) return null;
    const o = it as Record<string, unknown>;
    const chaves = Object.keys(o);
    if (!chaves.length) return null;
    const nomeKey = chaves.find((k) => /nome|cidade|label|rotulo|regi|local|pais|estado/i.test(k)) ?? chaves[0];
    const valKey = chaves.find((k) => k !== nomeKey && (typeof o[k] === 'number' || /percent|valor|value|pct|taxa|qtd|total/i.test(k)))
      ?? chaves.find((k) => k !== nomeKey);
    if (valKey == null) return null;
    rec[String(o[nomeKey])] = o[valKey];
  }
  return Object.keys(rec).length ? rec : null;
}

/** True se os escalares do grupo são percentuais: têm '%', somam ~100 (gênero 76/23/1),
 *  ou são taxas no intervalo 0–100 com decimais (cidades 11.2/2.6/...). */
function ehPctGrupo(obj: Record<string, unknown>): boolean {
  const escal = escalaresDe(obj);
  if (escal.some(([, v]) => String(v).includes('%'))) return true;
  const nums = escal.map(([, v]) => valorNum(v)).filter((n): n is number => n != null);
  if (nums.length < 2 || !nums.every((n) => n >= 0 && n <= 100)) return false;
  const soma = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(soma - 100) <= 6) return true;
  const comDecimais = nums.filter((n) => Math.abs(n - Math.round(n)) > 1e-9).length;
  return comDecimais * 2 >= nums.length;
}

/** Rótulo de chave com traço em faixas numéricas (13_17 → 13-17, 65_mais → 65+). */
function rotularChave(k: string): string {
  if (/^\d+_\d+$/.test(k)) return k.replace('_', '-');
  if (/^\d+_mais$/i.test(k)) return k.replace(/_mais$/i, '+');
  return rotular(k);
}

/** Texto + largura de barra de um escalar, considerando se o grupo é percentual. */
function pctInfo(v: unknown, pctGrupo: boolean): { display: string; largura: string | null } {
  const jaPct = String(v).includes('%');
  const num = valorNum(v);
  if (jaPct) return { display: String(v).trim().replace('.', ','), largura: `${Math.max(0, Math.min(100, valorPct(v)))}%` };
  if (pctGrupo && num != null) return { display: `${String(num).replace('.', ',')}%`, largura: `${Math.max(0, Math.min(100, num))}%` };
  return { display: formatarValor(v), largura: null };
}

/** Gera frases-resumo do público a partir dos painéis demográficos (gênero/faixa/cidade). */
function resumoPublico(objetos: [string, Record<string, unknown>][]): string[] {
  const frases: string[] = [];
  for (const [nome, obj] of objetos) {
    if (!ehPctGrupo(obj)) continue;
    const escal = escalaresDe(obj).filter(([, v]) => valorNum(v) != null);
    if (!escal.length) continue;
    const [chave, valor] = escal.reduce((a, b) => ((valorNum(b[1]) ?? -1) > (valorNum(a[1]) ?? -1) ? b : a));
    const pct = pctInfo(valor, true).display;
    const n = nome.toLowerCase();
    if (/g[êe]n|sexo/.test(n)) {
      const genero = /home|masc/i.test(chave) ? 'masculino' : 'feminino';
      // qualificador distingue painéis múltiplos (Gênero Espectadores / Gênero Seguidores).
      const qualif = nome.replace(/g[êe]nero?/i, '').replace(/[_-]/g, ' ').trim();
      frases.push(qualif
        ? `${rotular(qualif)} majoritariamente ${genero} (${pct}).`
        : `Público majoritariamente ${genero} (${pct}).`);
    } else if (/cidad|local|regi/.test(n)) {
      frases.push(`Principal cidade é ${rotularChave(chave)} (${pct}).`);
    } else if (/faixa|et[áa]r|^idade|\bidade\b/.test(n)) {
      frases.push(`Faixa etária dominante de ${rotularChave(chave)} anos (${pct}).`);
    } else {
      frases.push(`${rotular(nome)}: ${rotularChave(chave)} (${pct}).`);
    }
  }
  return frases;
}

function Topo({ template, styles, tema }: Readonly<{ template: MidiaKitTemplate; styles: Styles; tema: Tema }>) {
  return (
    <View style={styles.topbar}>
      <LogoFeat tema={tema} />
      <Text style={styles.topRight}>Mídia Kit {template.influenciador?.nome ?? template.nome} {ANO}</Text>
    </View>
  );
}

function Capa({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const influ = template.influenciador;
  const fotoSessao = parseFotos(sessao.fotos)[0];
  const foto = fotoSessao ?? (ehUrl(influ?.foto) ? influ!.foto! : null); // #1 prioriza foto da seção
  const config = parseConfig(sessao.config);
  const redes = (config.redes ?? []).filter((r) => r.mostrar && (r.seguidores || r.handle));
  const nicho = [influ?.nicho, influ?.subnicho].filter(Boolean).join(' · ');
  const nomeCapa = (config.nomeCapa?.trim() || influ?.nome || template.nome).toUpperCase();

  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <Topo template={template} styles={styles} tema={tema} />
      <View style={styles.capaBody}>
        <View style={styles.capaMain}>
          <View style={styles.capaInfo}>
            <Text style={styles.capaLabel}>Mídia Kit {ANO}</Text>
            <Text style={styles.capaNome}>{nomeCapa}</Text>
            {nicho ? <Text style={styles.capaNicho}>{nicho}</Text> : null}
          </View>
          {foto && <View style={styles.capaFotoFrame}><Image src={foto} style={styles.capaFoto} /></View>}
        </View>
        <View style={styles.pillsRow}>
          {redes.map((r) => <PillRede key={r.rede} r={r} styles={styles} tema={tema} />)}
        </View>
      </View>
    </Page>
  );
}

function Sobre({ sessao }: Readonly<{ sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const fotos = parseFotos(sessao.fotos);
  const paragrafos = (sessao.conteudo ?? '').split(/\n\s*\n/).filter(Boolean);
  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <View style={styles.sobreCenter}>
        <View style={styles.secaoHead}>
          <TituloAcento texto={sessao.titulo || 'Sobre o influenciador'} styles={styles} />
        </View>
        <View style={styles.sobreWrap}>
          <View style={styles.sobreTexto}>
            {paragrafos.length > 0
              ? paragrafos.map((p) => <Text key={p.slice(0, 24)} style={styles.paragrafo}>{p}</Text>)
              : <Text>{sessao.conteudo}</Text>}
          </View>
          {fotos[0] && <View style={styles.sobreFotoFrame}><Image src={fotos[0]} style={styles.sobreFoto} /></View>}
        </View>
      </View>
    </Page>
  );
}

function Conteudos({ sessao }: Readonly<{ sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const fotos = parseFotos(sessao.fotos);
  const links = parseConfig(sessao.config).links ?? [];
  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <View style={styles.secaoHead}>
        <TituloAcento texto={sessao.titulo || 'Conteúdos recentes'} styles={styles} />
      </View>
      <Text style={styles.subtitulo}>{sessao.conteudo || 'Clique nas imagens para assistir aos vídeos.'}</Text>
      <View style={styles.conteudosCenter}>
        <View style={styles.cardsRow}>
          {fotos.map((src, i) => {
            const card = <Image src={src} style={styles.conteudoCard} />;
            const url = garantirUrl(links[i]);
            return url ? <Link key={src.slice(-16)} src={url}>{card}</Link> : <View key={src.slice(-16)}>{card}</View>;
          })}
        </View>
      </View>
    </Page>
  );
}

function ConteudoObjeto({ obj, styles }: Readonly<{ obj: Record<string, unknown>; styles: Styles }>) {
  const pctGrupo = ehPctGrupo(obj);
  return (
    <>
      {Object.entries(obj).map(([sk, sv]) => {
        if (Array.isArray(sv)) {
          const rec = arrayObjParaRecord(sv);
          if (rec) {
            return (
              <View key={sk} style={styles.subGrupo}>
                <Text style={styles.subGrupoTit}>{rotular(sk)}</Text>
                <ConteudoObjeto obj={rec} styles={styles} />
              </View>
            );
          }
          return (
            <View key={sk} style={styles.demoItem}>
              <Text style={styles.demoKey}>{rotular(sk)}: {sv.map((x) => formatarValor(x)).join(', ')}</Text>
            </View>
          );
        }
        if (sv && typeof sv === 'object') {
          return (
            <View key={sk} style={styles.subGrupo}>
              <Text style={styles.subGrupoTit}>{rotular(sk)}</Text>
              <ConteudoObjeto obj={sv as Record<string, unknown>} styles={styles} />
            </View>
          );
        }
        const { display, largura } = pctInfo(sv, pctGrupo);
        return (
          <View key={sk} style={styles.demoItem}>
            <View style={styles.demoItemHead}>
              <Text style={styles.demoKey}>{rotularChave(sk)}</Text>
              <Text style={styles.demoVal}>{display}</Text>
            </View>
            {largura ? <View style={styles.barTrack}><View style={[styles.barFill, { width: largura }]} /></View> : null}
          </View>
        );
      })}
    </>
  );
}

function Insights({ sessao }: Readonly<{ sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const dados = parseAnalytics(sessao.analyticsJson);
  const escalares: [string, unknown][] = [];
  const objetos: [string, Record<string, unknown>][] = [];
  const listas: unknown[] = [];
  Object.entries(dados).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      const rec = arrayObjParaRecord(v);
      if (rec) objetos.push([k, rec]);
      else listas.push(...v);
    } else if (v && typeof v === 'object') objetos.push([k, v as Record<string, unknown>]);
    else escalares.push([k, v]);
  });

  const redeInfo = TIPO_REDE[sessao.tipo];
  const titulo = (!sessao.titulo || /^insights/i.test(sessao.titulo.trim())) ? `Insights ${MES_ANO}` : sessao.titulo;
  const linkPrints = garantirUrl(parseConfig(sessao.config).linkPrints);

  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      {redeInfo && (
        <View style={styles.redeHead}>
          <IconeRede rede={redeInfo.rede} size={16} color={tema.lime} />
          <Text style={styles.redeNome}>{redeInfo.nome}</Text>
        </View>
      )}
      <View style={styles.insightsCenter}>
      <View style={styles.insightsHead}>
        <TituloAcento texto={titulo} styles={styles} />
      </View>
      {sessao.conteudo ? <Text style={styles.subtitulo}>{sessao.conteudo}</Text> : <View style={{ height: 6 }} />}
      {linkPrints ? <Link src={linkPrints} style={styles.linkPrints}>Clique <Text style={styles.linkPrintsUnderline}>aqui</Text> para baixar os prints originais dos insights</Link> : null}

      {escalares.length > 0 && (
        <View style={styles.metricGrid}>
          {escalares.map(([k, v]) => {
            const ehPct = String(v).includes('%');
            return (
              <View key={k} style={styles.metricCard}>
                <Text style={styles.metricVal}>{formatarValor(v)}</Text>
                <Text style={styles.metricLabel}>{rotular(k)}</Text>
                {ehPct ? <View style={[styles.barTrack, { marginTop: 8 }]}><View style={[styles.barFill, { width: larguraBarra(v) }]} /></View> : null}
              </View>
            );
          })}
        </View>
      )}

      {objetos.length > 0 && (
        <View style={styles.demoRow}>
          {objetos.slice(0, 3).map(([k, obj]) => (
            <View key={k} style={styles.demoPanel}>
              <Text style={styles.demoTitulo}>{rotular(k)}</Text>
              <ConteudoObjeto obj={obj} styles={styles} />
            </View>
          ))}
        </View>
      )}

      {(() => {
        const resumo = resumoPublico(objetos);
        const badges = resumo.length ? resumo : listas.map((x) => formatarValor(x));
        if (!badges.length) return null;
        return (
          <View style={styles.resumoWrap}>
            <Text style={styles.resumoTit}>Resumo do público</Text>
            <View style={styles.publicoRow}>
              {badges.map((txt) => <Text key={txt} style={styles.publicoPill}>{txt}</Text>)}
            </View>
          </View>
        );
      })()}
      </View>
    </Page>
  );
}

function Marcas({ sessao }: Readonly<{ sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const config = parseConfig(sessao.config);
  const marcas = (config.marcas ?? []).filter((m) => ehUrl(m.logotipo));
  const fotos = parseFotos(sessao.fotos); // imagens manuais extras (sem nome)
  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <View style={styles.secaoHead}>
        <TituloAcento texto={sessao.titulo || labelTipo(sessao.tipo)} styles={styles} />
      </View>
      {sessao.conteudo ? <Text style={styles.subtitulo}>{sessao.conteudo}</Text> : <View style={{ height: 12 }} />}
      {(marcas.length > 0 || fotos.length > 0) && (
        <View style={styles.marcasGrid}>
          {marcas.map((m) => (
            <View key={m.id} style={styles.marcaCard}>
              <Image src={m.logotipo!} style={styles.marcaLogo} />
              <Text style={styles.marcaNome}>{m.nome}</Text>
            </View>
          ))}
          {fotos.map((src) => (
            <View key={src.slice(-16)} style={styles.marcaCard}>
              <Image src={src} style={styles.marcaLogo} />
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

function Galeria({ sessao }: Readonly<{ sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const fotos = parseFotos(sessao.fotos);
  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <View style={styles.secaoHead}>
        <TituloAcento texto={sessao.titulo || labelTipo(sessao.tipo)} styles={styles} />
      </View>
      {sessao.conteudo ? <Text style={styles.subtitulo}>{sessao.conteudo}</Text> : <View style={{ height: 12 }} />}
      {fotos.length > 0 && (
        <View style={styles.fotosGrid}>
          {fotos.map((src) => <Image key={src.slice(-16)} src={src} style={styles.fotoItem} />)}
        </View>
      )}
    </Page>
  );
}

function Contato({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const influ: InfluenciadorRef | null = template.influenciador;
  const config = parseConfig(sessao.config);
  const email = config.email ?? influ?.email ?? '';
  const whatsapp = config.whatsapp ?? influ?.telefone ?? '';
  const mostrarEmail = config.mostrarEmail !== false && !!email;
  const mostrarWhatsapp = config.mostrarWhatsapp !== false && !!whatsapp;
  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <Topo template={template} styles={styles} tema={tema} />
      <View style={styles.contatoBody}>
        <Text style={styles.contatoTitulo}>E aí, bora{'\n'}fazer um <Text style={styles.tituloLime}>feat?</Text></Text>
        <View style={styles.contatoCards}>
          {mostrarEmail && (
            <View style={styles.contatoCard}>
              <Text style={styles.contatoLabel}>Email</Text>
              <View style={styles.contatoLinha}>
                <View style={styles.contatoIcone}><IconeRede rede="EMAIL" size={13} color={tema.lime} /></View>
                <Text style={styles.contatoVal}>{email}</Text>
              </View>
            </View>
          )}
          {mostrarWhatsapp && (
            <View style={styles.contatoCard}>
              <Text style={styles.contatoLabel}>WhatsApp</Text>
              <View style={styles.contatoLinha}>
                <View style={styles.contatoIcone}><IconeRede rede="WHATSAPP" size={13} color={tema.lime} /></View>
                <Text style={styles.contatoVal}>{formatarTelefone(whatsapp)}</Text>
              </View>
            </View>
          )}
        </View>
        {sessao.conteudo ? <Text style={styles.contatoSub}>{sessao.conteudo}</Text> : null}
      </View>
      <View style={styles.rodape}>
        <Text style={styles.rodapeTxt}>Mídia kit gerado pela Feat Creators - a maior agência de influenciadores de tecnologia do Brasil.</Text>
        <View style={styles.rodapeLinks}>
          <Link src="https://featcreators.com.br" style={styles.rodapeLink}>featcreators.com.br</Link>
          <Link src="https://instagram.com/feat.creators" style={styles.rodapeLink}>@feat.creators</Link>
          <Link src="https://www.linkedin.com/company/feat-creators/" style={styles.rodapeLink}>LinkedIn</Link>
        </View>
      </View>
    </Page>
  );
}

function renderSessao(template: MidiaKitTemplate, sessao: Sessao, key: string) {
  switch (sessao.tipo) {
    case 'CAPA': return <Capa key={key} template={template} sessao={sessao} />;
    case 'SOBRE_INFLUENCIADOR': return <Sobre key={key} sessao={sessao} />;
    case 'CONTEUDOS':
    case 'EXEMPLOS_PUBLIS': return <Conteudos key={key} sessao={sessao} />;
    case 'INSIGHTS_INSTAGRAM':
    case 'INSIGHTS_TIKTOK':
    case 'INSIGHTS_YOUTUBE': return <Insights key={key} sessao={sessao} />;
    case 'MARCAS': return <Marcas key={key} sessao={sessao} />;
    case 'CONTATO': return <Contato key={key} template={template} sessao={sessao} />;
    default: return <Galeria key={key} sessao={sessao} />;
  }
}

export function MidiaKitDocument({ template }: Readonly<{ template: MidiaKitTemplate }>) {
  const sessoes = [...(template.sessoes ?? [])]
    .filter((s) => s.ativa !== false)
    .sort((a, b) => a.ordem - b.ordem);
  return (
    <Document title={`Mídia Kit — ${template.nome}`}>
      {sessoes.map((s, i) => renderSessao(template, s, s.id ?? `s-${i}`))}
    </Document>
  );
}

/** Gera o PDF do template e dispara o download no navegador. */
export async function baixarPdf(template: MidiaKitTemplate): Promise<void> {
  const blob = await pdf(<MidiaKitDocument template={template} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `midia-kit-${(template.nome || 'template').replace(/\s+/g, '-').toLowerCase()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export default MidiaKitDocument;
