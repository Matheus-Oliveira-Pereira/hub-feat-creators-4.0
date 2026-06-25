import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Link } from '@react-pdf/renderer';
import { MidiaKitTemplate, Sessao, InfluenciadorRef, RedeCapa, labelTipo, parseFotos, parseConfig, formatarValor, garantirUrl } from '../../service';
import { SOCIAL_ICONS } from './socialIcons';
import icoBarras from '../../../../assets/icons_transparent_background 2.png';
import icoPizza from '../../../../assets/icons_transparent_background 3.png';
import icoSeta from '../../../../assets/icons_transparent_background 6.png';
import icoBalao from '../../../../assets/icons_transparent_background 8.png';
import icoCoracao from '../../../../assets/icons_transparent_background 9.png';
import icoPessoa from '../../../../assets/icons_transparent_background 11.png';

const ANO = new Date().getFullYear();

// Ícones decorativos da marca por tipo de seção
const SECAO_ICONE: Record<string, string> = {
  SOBRE_INFLUENCIADOR: icoPessoa,
  CONTEUDOS: icoBalao,
  INSIGHTS_INSTAGRAM: icoBarras,
  INSIGHTS_TIKTOK: icoSeta,
  INSIGHTS_YOUTUBE: icoBarras,
  MARCAS: icoCoracao,
  EXEMPLOS_PUBLIS: icoPizza,
  CONTATO: icoBalao,
};

const BG = '#141414';
const CARD = '#1a1a1a';
const LIME = '#C2E000';
const TEXT = '#f5f5f5';
const MUTED = '#9ca3af';

const styles = StyleSheet.create({
  page: { backgroundColor: BG, color: TEXT, padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  brand: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: LIME },
  topRight: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' },

  titulo: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: TEXT },
  tituloLime: { color: LIME },
  subtitulo: { fontSize: 10, color: MUTED, marginTop: 4, marginBottom: 18 },

  // Capa
  capaBody: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 10 },
  capaMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexGrow: 1 },
  capaInfo: { flex: 1, paddingRight: 24 },
  capaLabel: { fontSize: 10, color: LIME, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, fontFamily: 'Helvetica-Bold' },
  capaNome: { fontSize: 54, fontFamily: 'Helvetica-Bold', color: TEXT, lineHeight: 1.05 },
  capaNicho: { fontSize: 12, color: LIME, marginTop: 16 },
  capaFoto: { width: 212, height: 212, borderRadius: 18, objectFit: 'cover', border: `2 solid ${LIME}` },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: CARD, borderRadius: 22, paddingVertical: 9, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillVal: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: LIME },

  // Sobre
  sobreWrap: { flexDirection: 'row', gap: 28, alignItems: 'center', flexGrow: 1 },
  sobreTexto: { flex: 1, fontSize: 11.5, lineHeight: 1.7, color: '#d1d5db' },
  sobreFoto: { width: 260, height: 300, borderRadius: 18, objectFit: 'cover', border: `1 solid #2a2a2a` },
  paragrafo: { marginBottom: 12 },

  cardsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  conteudoCard: { width: 150, height: 250, borderRadius: 14, objectFit: 'cover' },

  insightsHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  secaoHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  secaoIcone: { width: 26, height: 26, objectFit: 'contain' },

  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18, marginTop: 14 },
  metricCard: { backgroundColor: CARD, borderRadius: 14, padding: 16, minWidth: 150, flexGrow: 1 },
  metricVal: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: LIME },
  metricLabel: { fontSize: 9, color: MUTED, marginTop: 4, textTransform: 'capitalize' },

  demoRow: { flexDirection: 'row', gap: 12 },
  demoPanel: { flex: 1, backgroundColor: CARD, borderRadius: 14, padding: 14 },
  demoTitulo: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  demoItem: { marginBottom: 7 },
  demoItemHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  demoKey: { fontSize: 9, color: TEXT, textTransform: 'capitalize' },
  demoVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: LIME },
  barTrack: { height: 3, backgroundColor: '#2a2a2a', borderRadius: 2 },
  barFill: { height: 3, backgroundColor: LIME, borderRadius: 2 },
  subGrupo: { marginBottom: 6, marginTop: 2 },
  subGrupoTit: { fontSize: 8, color: LIME, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  publicoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  publicoPill: { backgroundColor: CARD, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 12, fontSize: 9, color: '#d1d5db' },

  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  fotoItem: { width: 150, height: 150, borderRadius: 12, objectFit: 'cover' },

  // Contato
  contatoBody: { flexGrow: 1, justifyContent: 'center' },
  contatoTitulo: { fontSize: 38, fontFamily: 'Helvetica-Bold', color: TEXT, maxWidth: 420, marginBottom: 10, lineHeight: 1.1 },
  contatoSub: { fontSize: 11, color: MUTED, marginBottom: 24 },
  contatoCards: { flexDirection: 'row', gap: 14 },
  contatoCard: { backgroundColor: CARD, borderRadius: 14, padding: 18, flex: 1 },
  contatoLabel: { fontSize: 8, color: LIME, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  contatoVal: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: TEXT },

  rodape: { borderTop: '1 solid #2a2a2a', paddingTop: 10 },
  rodapeTxt: { fontSize: 8, color: MUTED, marginBottom: 5 },
  rodapeLinks: { flexDirection: 'row', gap: 14 },
  rodapeLink: { fontSize: 8, color: LIME },
});

function IconeRede({ rede, size = 14, color = LIME }: Readonly<{ rede: string; size?: number; color?: string }>) {
  const d = SOCIAL_ICONS[rede];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} />
    </Svg>
  );
}

function IconeSecao({ tipo }: Readonly<{ tipo: string }>) {
  const src = SECAO_ICONE[tipo];
  if (!src) return null;
  return <Image src={src} style={styles.secaoIcone} />;
}

function TituloAcento({ texto, base = styles.titulo }: Readonly<{ texto: string; base?: typeof styles.titulo }>) {
  const palavras = (texto ?? '').trim().split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return <Text style={base}>{texto}</Text>;
  const ultima = palavras.pop();
  return <Text style={base}>{palavras.join(' ')} <Text style={styles.tituloLime}>{ultima}</Text></Text>;
}

function PillRede({ r }: Readonly<{ r: RedeCapa }>) {
  const inner = (
    <>
      <IconeRede rede={r.rede} />
      <Text style={styles.pillVal}>{r.seguidores || r.handle}</Text>
    </>
  );
  if (r.url) return <Link src={garantirUrl(r.url)} style={styles.pill}>{inner}</Link>;
  return <View style={styles.pill}>{inner}</View>;
}

function ehUrl(s?: string | null): boolean {
  return !!s && (/^https?:\/\//.test(s) || s.startsWith('data:image'));
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
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function larguraBarra(v: unknown): string {
  const m = /([\d.,]+)\s*%/.exec(String(v));
  if (!m) return '0%';
  const n = Number.parseFloat(m[1].replace(',', '.'));
  return `${Math.max(0, Math.min(100, n))}%`;
}

function Topo({ template }: Readonly<{ template: MidiaKitTemplate }>) {
  return (
    <View style={styles.topbar}>
      <Text style={styles.brand}>feat CREATORS</Text>
      <Text style={styles.topRight}>Mídia Kit {template.influenciador?.nome ?? template.nome}</Text>
    </View>
  );
}

function Capa({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const influ = template.influenciador;
  const fotoSessao = parseFotos(sessao.fotos)[0];
  const foto = fotoSessao ?? (ehUrl(influ?.foto) ? influ!.foto! : null); // #1 prioriza foto da seção
  const config = parseConfig(sessao.config);
  const redes = (config.redes ?? []).filter((r) => r.mostrar && (r.seguidores || r.handle));
  const nicho = [influ?.nicho, influ?.subnicho].filter(Boolean).join(' · ');

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Topo template={template} />
      <View style={styles.capaBody}>
        <View style={styles.capaMain}>
          <View style={styles.capaInfo}>
            <Text style={styles.capaLabel}>Mídia Kit {ANO}</Text>
            <Text style={styles.capaNome}>{(influ?.nome ?? template.nome).toUpperCase()}</Text>
            {nicho ? <Text style={styles.capaNicho}>{nicho}</Text> : null}
          </View>
          {foto && <Image src={foto} style={styles.capaFoto} />}
        </View>
        <View style={styles.pillsRow}>
          {redes.map((r) => <PillRede key={r.rede} r={r} />)}
        </View>
      </View>
    </Page>
  );
}

function Sobre({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const fotos = parseFotos(sessao.fotos);
  const paragrafos = (sessao.conteudo ?? '').split(/\n\s*\n/).filter(Boolean);
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Topo template={template} />
      <View style={styles.secaoHead}>
        <IconeSecao tipo={sessao.tipo} />
        <TituloAcento texto={sessao.titulo || 'Sobre o influenciador'} />
      </View>
      <View style={styles.sobreWrap}>
        <View style={styles.sobreTexto}>
          {paragrafos.length > 0
            ? paragrafos.map((p) => <Text key={p.slice(0, 24)} style={styles.paragrafo}>{p}</Text>)
            : <Text>{sessao.conteudo}</Text>}
        </View>
        {fotos[0] && <Image src={fotos[0]} style={styles.sobreFoto} />}
      </View>
    </Page>
  );
}

function Conteudos({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const fotos = parseFotos(sessao.fotos);
  const links = parseConfig(sessao.config).links ?? [];
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Topo template={template} />
      <View style={styles.secaoHead}>
        <IconeSecao tipo={sessao.tipo} />
        <TituloAcento texto={sessao.titulo || 'Conteúdos recentes'} />
      </View>
      <Text style={styles.subtitulo}>{sessao.conteudo || 'Clique nas imagens para assistir aos vídeos.'}</Text>
      <View style={styles.cardsRow}>
        {fotos.map((src, i) => {
          const card = <Image src={src} style={styles.conteudoCard} />;
          const url = garantirUrl(links[i]);
          return url ? <Link key={src.slice(-16)} src={url}>{card}</Link> : <View key={src.slice(-16)}>{card}</View>;
        })}
      </View>
    </Page>
  );
}

function ConteudoObjeto({ obj }: Readonly<{ obj: Record<string, unknown> }>) {
  return (
    <>
      {Object.entries(obj).map(([sk, sv]) => {
        if (Array.isArray(sv)) {
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
              <ConteudoObjeto obj={sv as Record<string, unknown>} />
            </View>
          );
        }
        const ehPct = String(sv).includes('%');
        return (
          <View key={sk} style={styles.demoItem}>
            <View style={styles.demoItemHead}>
              <Text style={styles.demoKey}>{rotular(sk)}</Text>
              <Text style={styles.demoVal}>{formatarValor(sv)}</Text>
            </View>
            {ehPct ? <View style={styles.barTrack}><View style={[styles.barFill, { width: larguraBarra(sv) }]} /></View> : null}
          </View>
        );
      })}
    </>
  );
}

function Insights({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const dados = parseAnalytics(sessao.analyticsJson);
  const escalares: [string, unknown][] = [];
  const objetos: [string, Record<string, unknown>][] = [];
  const listas: unknown[] = [];
  Object.entries(dados).forEach(([k, v]) => {
    if (Array.isArray(v)) listas.push(...v);
    else if (v && typeof v === 'object') objetos.push([k, v as Record<string, unknown>]);
    else escalares.push([k, v]);
  });

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Topo template={template} />
      <View style={styles.insightsHead}>
        <IconeSecao tipo={sessao.tipo} />
        <TituloAcento texto={sessao.titulo || labelTipo(sessao.tipo)} />
      </View>
      {sessao.conteudo ? <Text style={styles.subtitulo}>{sessao.conteudo}</Text> : <View style={{ height: 6 }} />}

      {escalares.length > 0 && (
        <View style={styles.metricGrid}>
          {escalares.map(([k, v]) => (
            <View key={k} style={styles.metricCard}>
              <Text style={styles.metricVal}>{formatarValor(v)}</Text>
              <Text style={styles.metricLabel}>{rotular(k)}</Text>
            </View>
          ))}
        </View>
      )}

      {objetos.length > 0 && (
        <View style={styles.demoRow}>
          {objetos.slice(0, 3).map(([k, obj]) => (
            <View key={k} style={styles.demoPanel}>
              <Text style={styles.demoTitulo}>{rotular(k)}</Text>
              <ConteudoObjeto obj={obj} />
            </View>
          ))}
        </View>
      )}

      {listas.length > 0 && (
        <View style={styles.publicoRow}>
          {listas.map((item, i) => (
            <Text key={`pub-${i}`} style={styles.publicoPill}>{formatarValor(item)}</Text>
          ))}
        </View>
      )}
    </Page>
  );
}

function Galeria({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const fotos = parseFotos(sessao.fotos);
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Topo template={template} />
      <View style={styles.secaoHead}>
        <IconeSecao tipo={sessao.tipo} />
        <TituloAcento texto={sessao.titulo || labelTipo(sessao.tipo)} />
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
  const influ: InfluenciadorRef | null = template.influenciador;
  const config = parseConfig(sessao.config);
  const email = config.email ?? influ?.email ?? '';
  const whatsapp = config.whatsapp ?? influ?.telefone ?? '';
  const mostrarEmail = config.mostrarEmail !== false && !!email;
  const mostrarWhatsapp = config.mostrarWhatsapp !== false && !!whatsapp;
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Topo template={template} />
      <View style={styles.contatoBody}>
        <View style={styles.secaoHead}>
          <IconeSecao tipo={sessao.tipo} />
          <TituloAcento texto={sessao.titulo || 'E aí, bora fazer um feat?'} base={styles.contatoTitulo} />
        </View>
        {sessao.conteudo ? <Text style={styles.contatoSub}>{sessao.conteudo}</Text> : null}
        <View style={styles.contatoCards}>
          {mostrarEmail && (
            <View style={styles.contatoCard}>
              <Text style={styles.contatoLabel}>E-mail</Text>
              <Text style={styles.contatoVal}>{email}</Text>
            </View>
          )}
          {mostrarWhatsapp && (
            <View style={styles.contatoCard}>
              <Text style={styles.contatoLabel}>WhatsApp</Text>
              <Text style={styles.contatoVal}>{whatsapp}</Text>
            </View>
          )}
        </View>
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
    case 'SOBRE_INFLUENCIADOR': return <Sobre key={key} template={template} sessao={sessao} />;
    case 'CONTEUDOS': return <Conteudos key={key} template={template} sessao={sessao} />;
    case 'INSIGHTS_INSTAGRAM':
    case 'INSIGHTS_TIKTOK':
    case 'INSIGHTS_YOUTUBE': return <Insights key={key} template={template} sessao={sessao} />;
    case 'CONTATO': return <Contato key={key} template={template} sessao={sessao} />;
    default: return <Galeria key={key} template={template} sessao={sessao} />;
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

export default MidiaKitDocument;
