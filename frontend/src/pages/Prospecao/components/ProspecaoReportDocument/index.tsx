import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Prospecao, TIPO_LABEL, statusRelatorio } from '../../service';

const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const LIME = '#C2E000';
const TEXT = '#f5f5f5';
const MUTED = '#9ca3af';
const BORDER = '#3d3d3d';

const styles = StyleSheet.create({
  page: { backgroundColor: BG, color: TEXT, padding: 36, fontFamily: 'Helvetica', fontSize: 10 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  titulo: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: TEXT },
  tituloLime: { color: LIME },
  sub: { fontSize: 9, color: MUTED, marginTop: 4 },
  data: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },

  tabela: { borderRadius: 8, overflow: 'hidden', border: `1 solid ${BORDER}` },
  th: { flexDirection: 'row', backgroundColor: CARD, paddingVertical: 8, paddingHorizontal: 10 },
  tr: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderTop: `1 solid ${BORDER}` },
  thCell: { fontSize: 8, color: LIME, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tdCell: { fontSize: 9, color: TEXT },

  cMarca: { width: '30%' },
  cTipo: { width: '16%' },
  cStatus: { width: '24%' },
  cValor: { width: '16%' },
  cData: { width: '14%' },

  resumo: { marginTop: 18, flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  resumoCard: { backgroundColor: CARD, borderRadius: 8, padding: 12, border: `1 solid ${BORDER}`, minWidth: 120 },
  resumoVal: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: LIME },
  resumoLabel: { fontSize: 8, color: MUTED, marginTop: 4, textTransform: 'uppercase' },

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

export function ProspecaoReportDocument({
  influenciadorNome,
  prospecoes,
}: Readonly<{ influenciadorNome: string; prospecoes: Prospecao[] }>) {
  const total = prospecoes.length;
  const emNegociacao = prospecoes.filter((p) => statusRelatorio(p.status) === 'Em negociação').length;
  const fechadas = prospecoes.filter((p) => p.status === 'PUBLICIDADE_FECHADA').length;
  const encerradas = prospecoes.filter((p) => p.status === 'ENCERRADO').length;
  const hoje = new Date().toLocaleDateString('pt-BR');

  return (
    <Document title={`Relatório de Prospecção — ${influenciadorNome}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.titulo}>
              Relatório de <Text style={styles.tituloLime}>Prospecção</Text>
            </Text>
            <Text style={styles.sub}>{influenciadorNome}</Text>
          </View>
          <Text style={styles.data}>Gerado em {hoje}</Text>
        </View>

        <View style={styles.tabela}>
          <View style={styles.th}>
            <Text style={[styles.thCell, styles.cMarca]}>Marca</Text>
            <Text style={[styles.thCell, styles.cTipo]}>Tipo</Text>
            <Text style={[styles.thCell, styles.cStatus]}>Status</Text>
            <Text style={[styles.thCell, styles.cValor]}>Valor</Text>
            <Text style={[styles.thCell, styles.cData]}>Contato</Text>
          </View>
          {prospecoes.map((p) => (
            <View key={p.id} style={styles.tr}>
              <Text style={[styles.tdCell, styles.cMarca]}>{p.marca?.nome ?? '—'}</Text>
              <Text style={[styles.tdCell, styles.cTipo]}>{p.tipo ? TIPO_LABEL[p.tipo] : '—'}</Text>
              <Text style={[styles.tdCell, styles.cStatus]}>{statusRelatorio(p.status)}</Text>
              <Text style={[styles.tdCell, styles.cValor]}>{formatarValor(p.valorAceito ?? p.valorProposto)}</Text>
              <Text style={[styles.tdCell, styles.cData]}>{formatarData(p.dataContato)}</Text>
            </View>
          ))}
          {total === 0 && (
            <View style={styles.tr}>
              <Text style={styles.tdCell}>Nenhuma prospecção registrada.</Text>
            </View>
          )}
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoCard}><Text style={styles.resumoVal}>{total}</Text><Text style={styles.resumoLabel}>Total</Text></View>
          <View style={styles.resumoCard}><Text style={styles.resumoVal}>{emNegociacao}</Text><Text style={styles.resumoLabel}>Em negociação</Text></View>
          <View style={styles.resumoCard}><Text style={styles.resumoVal}>{fechadas}</Text><Text style={styles.resumoLabel}>Fechadas</Text></View>
          <View style={styles.resumoCard}><Text style={styles.resumoVal}>{encerradas}</Text><Text style={styles.resumoLabel}>Encerradas</Text></View>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTxt}>Relatório gerado pela Feat Creators.</Text>
        </View>
      </Page>
    </Document>
  );
}

export default ProspecaoReportDocument;
