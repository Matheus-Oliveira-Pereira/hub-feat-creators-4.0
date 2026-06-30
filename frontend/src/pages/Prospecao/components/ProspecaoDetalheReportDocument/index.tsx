import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';
import { Prospecao, TIPO_LABEL, STATUS_LABEL, statusRelatorio } from '../../service';
import { LOGO_PATHS, LOGO_VIEWBOX } from '../../../MidiaKits/components/MidiaKitDocument/logo';

function ehImg(src?: string | null): src is string {
  return !!src && (src.startsWith('http') || src.startsWith('data:'));
}

const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const LIME = '#C2E000';
const TEXT = '#f5f5f5';
const MUTED = '#9ca3af';
const BORDER = '#3d3d3d';

const styles = StyleSheet.create({
  page: { backgroundColor: BG, color: TEXT, padding: 36, fontFamily: 'Helvetica', fontSize: 10 },
  brandbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logo: { width: 110, height: 30, objectFit: 'contain' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, objectFit: 'cover', border: `1.5 solid ${LIME}` },
  titulo: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: TEXT },
  tituloLime: { color: LIME },
  sub: { fontSize: 9, color: MUTED, marginTop: 4 },
  data: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  item: { backgroundColor: CARD, borderRadius: 8, padding: 10, border: `1 solid ${BORDER}`, width: '31%' },
  itemLabel: { fontSize: 7.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  itemVal: { fontSize: 11, color: TEXT, fontFamily: 'Helvetica-Bold' },

  secaoTit: { fontSize: 11, color: LIME, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 6 },

  obsBox: { backgroundColor: CARD, borderRadius: 8, padding: 12, border: `1 solid ${BORDER}`, marginBottom: 16 },
  obsTxt: { fontSize: 10, color: '#d1d5db', lineHeight: 1.5 },

  fuItem: { borderLeft: `2 solid ${LIME}`, paddingLeft: 10, marginBottom: 10 },
  fuHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  fuData: { fontSize: 9.5, color: TEXT, fontFamily: 'Helvetica-Bold' },
  fuStatus: { fontSize: 8, color: LIME },
  fuObs: { fontSize: 9.5, color: '#d1d5db', marginTop: 2 },
  fuEmail: { fontSize: 8, color: MUTED, marginTop: 2 },
  vazio: { fontSize: 9.5, color: MUTED },

  rodape: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTop: `1 solid ${BORDER}`, paddingTop: 8 },
  rodapeTxt: { fontSize: 7, color: MUTED },
});

function formatarValor(v: number | null): string {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatarData(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v.length <= 10 ? v + 'T00:00:00' : v);
  return d.toLocaleDateString('pt-BR');
}
function formatarDataHora(v: string): string {
  return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function ProspecaoDetalheReportDocument({ prospecao }: Readonly<{ prospecao: Prospecao }>) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const followUps = prospecao.followUps ?? [];
  const foto = prospecao.influenciador?.foto;

  return (
    <Document title={`Prospecção — ${prospecao.marca?.nome ?? ''}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandbar}>
          <Svg width={110} height={30} viewBox={LOGO_VIEWBOX} style={styles.logo}>
            {LOGO_PATHS.map((p) => <Path key={p.d.slice(0, 24)} d={p.d} fill={p.lime ? LIME : TEXT} />)}
          </Svg>
          <Text style={styles.data}>Gerado em {hoje}</Text>
        </View>

        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            {ehImg(foto) && <Image src={foto} style={styles.avatar} />}
            <View>
              <Text style={styles.titulo}>
                Prospecção <Text style={styles.tituloLime}>{prospecao.marca?.nome ?? ''}</Text>
              </Text>
              <Text style={styles.sub}>{prospecao.influenciador?.nome ?? ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.item}><Text style={styles.itemLabel}>Status</Text><Text style={styles.itemVal}>{statusRelatorio(prospecao.status)} ({STATUS_LABEL[prospecao.status]})</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Tipo</Text><Text style={styles.itemVal}>{prospecao.tipo ? TIPO_LABEL[prospecao.tipo] : '—'}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Data do contato</Text><Text style={styles.itemVal}>{formatarData(prospecao.dataContato)}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Contato da marca</Text><Text style={styles.itemVal}>{prospecao.contatoMarca?.nome ?? '—'}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Nicho</Text><Text style={styles.itemVal}>{prospecao.nicho ?? '—'}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Follow-ups</Text><Text style={styles.itemVal}>{followUps.length}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Valor proposto</Text><Text style={styles.itemVal}>{formatarValor(prospecao.valorProposto)}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Contraproposta</Text><Text style={styles.itemVal}>{formatarValor(prospecao.valorContraproposto)}</Text></View>
          <View style={styles.item}><Text style={styles.itemLabel}>Valor aceito</Text><Text style={styles.itemVal}>{formatarValor(prospecao.valorAceito)}</Text></View>
        </View>

        {prospecao.observacoes ? (
          <>
            <Text style={styles.secaoTit}>Observações</Text>
            <View style={styles.obsBox}><Text style={styles.obsTxt}>{prospecao.observacoes}</Text></View>
          </>
        ) : null}

        {prospecao.motivoEncerramento ? (
          <>
            <Text style={styles.secaoTit}>Motivo do encerramento</Text>
            <View style={styles.obsBox}><Text style={styles.obsTxt}>{prospecao.motivoEncerramento}</Text></View>
          </>
        ) : null}

        <Text style={styles.secaoTit}>Histórico de follow-ups</Text>
        {followUps.length === 0 && <Text style={styles.vazio}>Nenhum follow-up registrado.</Text>}
        {followUps.map((fu) => (
          <View key={fu.id} style={styles.fuItem}>
            <View style={styles.fuHead}>
              <Text style={styles.fuData}>{formatarDataHora(fu.data)}</Text>
              <Text style={styles.fuStatus}>{STATUS_LABEL[fu.statusProspecao]}</Text>
            </View>
            {fu.observacao ? <Text style={styles.fuObs}>{fu.observacao}</Text> : null}
            {fu.observacoes ? <Text style={styles.fuObs}>Obs. interna: {fu.observacoes}</Text> : null}
            {fu.logEmail ? <Text style={styles.fuEmail}>E-mail: {fu.logEmail.status}</Text> : null}
          </View>
        ))}

        <View style={styles.rodape}>
          <Text style={styles.rodapeTxt}>Relatório gerado pela Feat Creators.</Text>
        </View>
      </Page>
    </Document>
  );
}

export default ProspecaoDetalheReportDocument;
