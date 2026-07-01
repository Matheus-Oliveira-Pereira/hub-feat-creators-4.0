import { Document, Page, Text, View, StyleSheet, Svg, Path } from '@react-pdf/renderer';
import { LOGO_PATHS, LOGO_VIEWBOX } from '../../../MidiaKits/components/MidiaKitDocument/logo';
import {
  MetricasResumo,
  RankingItem,
  Distribuicao,
  formatarMoeda,
  STATUS_PROSPECAO_LABEL,
} from '../../service';

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
  data: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },

  titulo: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 2 },
  tituloLime: { color: LIME },
  sub: { fontSize: 9, color: MUTED, marginBottom: 18 },

  secao: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: LIME, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  cards: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  card: { backgroundColor: CARD, borderRadius: 8, padding: 12, border: `1 solid ${BORDER}`, width: '31%' },
  cardVal: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: LIME },
  cardLabel: { fontSize: 8, color: MUTED, marginTop: 4, textTransform: 'uppercase' },

  tabela: { borderRadius: 8, overflow: 'hidden', border: `1 solid ${BORDER}`, marginTop: 4 },
  th: { flexDirection: 'row', backgroundColor: CARD, paddingVertical: 7, paddingHorizontal: 10 },
  tr: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, borderTop: `1 solid ${BORDER}` },
  thCell: { fontSize: 8, color: LIME, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tdCell: { fontSize: 9, color: TEXT },
  cNome: { width: '52%' },
  cQtd: { width: '20%', textAlign: 'right' },
  cValor: { width: '28%', textAlign: 'right' },

  rodape: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTop: `1 solid ${BORDER}`, paddingTop: 8 },
  rodapeTxt: { fontSize: 7, color: MUTED },
});

function Kpi({ valor, label }: Readonly<{ valor: string; label: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardVal}>{valor}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

function Ranking({ titulo, itens }: Readonly<{ titulo: string; itens: RankingItem[] }>) {
  return (
    <View>
      <Text style={styles.secao}>{titulo}</Text>
      <View style={styles.tabela}>
        <View style={styles.th}>
          <Text style={[styles.thCell, styles.cNome]}>Nome</Text>
          <Text style={[styles.thCell, styles.cQtd]}>Deals</Text>
          <Text style={[styles.thCell, styles.cValor]}>Faturamento</Text>
        </View>
        {itens.map((i) => (
          <View key={i.id} style={styles.tr}>
            <Text style={[styles.tdCell, styles.cNome]}>{i.nome}</Text>
            <Text style={[styles.tdCell, styles.cQtd]}>{i.quantidade}</Text>
            <Text style={[styles.tdCell, styles.cValor]}>{formatarMoeda(i.valor)}</Text>
          </View>
        ))}
        {itens.length === 0 && (
          <View style={styles.tr}><Text style={styles.tdCell}>Sem dados no período.</Text></View>
        )}
      </View>
    </View>
  );
}

export function MetricasReportDocument({
  resumo,
  rankingInfluenciadores,
  rankingMarcas,
  funil,
  periodo,
}: Readonly<{
  resumo: MetricasResumo;
  rankingInfluenciadores: RankingItem[];
  rankingMarcas: RankingItem[];
  funil: Distribuicao[];
  periodo: string;
}>) {
  const hoje = new Date().toLocaleDateString('pt-BR');

  return (
    <Document title="Relatório de Métricas — Feat Creators">
      <Page size="A4" style={styles.page}>
        <View style={styles.brandbar}>
          <Svg width={110} height={30} viewBox={LOGO_VIEWBOX} style={styles.logo}>
            {LOGO_PATHS.map((p) => <Path key={p.d.slice(0, 24)} d={p.d} fill={p.lime ? LIME : TEXT} />)}
          </Svg>
          <Text style={styles.data}>Gerado em {hoje}</Text>
        </View>

        <Text style={styles.titulo}>
          Relatório de <Text style={styles.tituloLime}>Métricas</Text>
        </Text>
        <Text style={styles.sub}>{periodo}</Text>

        <Text style={styles.secao}>Financeiro</Text>
        <View style={styles.cards}>
          <Kpi valor={formatarMoeda(resumo.faturamentoTotal)} label="Faturamento total" />
          <Kpi valor={formatarMoeda(resumo.receitaAssessora)} label="Receita assessoria" />
          <Kpi valor={formatarMoeda(resumo.repasseInfluenciador)} label="Repasse influenciadores" />
          <Kpi valor={formatarMoeda(resumo.valorRecebido)} label={`Recebido (${resumo.countRecebido})`} />
          <Kpi valor={formatarMoeda(resumo.valorPendente)} label={`Pendente (${resumo.countPendente})`} />
          <Kpi valor={formatarMoeda(resumo.valorAtrasado)} label={`Atrasado (${resumo.countAtrasado})`} />
          <Kpi valor={formatarMoeda(resumo.ticketMedio)} label="Ticket médio" />
          <Kpi valor={String(resumo.totalDeals)} label="Total de deals" />
          <Kpi valor={String(resumo.totalNotas)} label="Notas emitidas" />
        </View>

        <Text style={styles.secao}>Pipeline comercial</Text>
        <View style={styles.cards}>
          <Kpi valor={String(resumo.totalProspecoes)} label="Prospecções" />
          <Kpi valor={String(resumo.prospecoesFechadas)} label="Fechadas" />
          <Kpi valor={`${resumo.taxaConversao}%`} label="Taxa de conversão" />
          <Kpi valor={formatarMoeda(resumo.valorEmNegociacao)} label="Em negociação" />
          <Kpi valor={formatarMoeda(resumo.valorFechado)} label="Valor fechado" />
          <Kpi valor={String(resumo.prospecoesEmAndamento)} label="Em andamento" />
        </View>

        <Ranking titulo="Top influenciadores" itens={rankingInfluenciadores} />

        <View style={styles.rodape}>
          <Text style={styles.rodapeTxt}>Relatório gerado pela Feat Creators.</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Ranking titulo="Top marcas" itens={rankingMarcas} />

        <Text style={styles.secao}>Funil de prospecção</Text>
        <View style={styles.tabela}>
          <View style={styles.th}>
            <Text style={[styles.thCell, styles.cNome]}>Status</Text>
            <Text style={[styles.thCell, styles.cQtd]}>Qtd</Text>
            <Text style={[styles.thCell, styles.cValor]}>Valor proposto</Text>
          </View>
          {funil.map((d) => (
            <View key={d.categoria} style={styles.tr}>
              <Text style={[styles.tdCell, styles.cNome]}>{STATUS_PROSPECAO_LABEL[d.categoria] ?? d.categoria}</Text>
              <Text style={[styles.tdCell, styles.cQtd]}>{d.quantidade}</Text>
              <Text style={[styles.tdCell, styles.cValor]}>{formatarMoeda(d.valor)}</Text>
            </View>
          ))}
          {funil.length === 0 && (
            <View style={styles.tr}><Text style={styles.tdCell}>Sem dados no período.</Text></View>
          )}
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTxt}>Relatório gerado pela Feat Creators.</Text>
        </View>
      </Page>
    </Document>
  );
}

export default MetricasReportDocument;
