import { Page, View, Text, Link } from '@react-pdf/renderer';
import { Sessao, formatarValor, garantirUrl, parseConfig } from '../../service';
import { IconeRede, TituloAcento, ConteudoObjeto } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W } from './styles';
import { parseAnalytics, arrayObjParaRecord, rotular, larguraBarra, resumoPublico } from './analyticsUtils';

// Mês/ano de referência (ex.: "Junho/2026") para o título dos insights.
const MES_ANO = (() => {
  const partes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).split(' '); // ["junho","de","2026"]
  const mes = partes[0] ?? '';
  const ano = partes[partes.length - 1] ?? '';
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}/${ano}`;
})();

// Rede + rótulo do head dos insights por tipo de seção.
const TIPO_REDE: Record<string, { rede: string; nome: string }> = {
  INSIGHTS_INSTAGRAM: { rede: 'INSTAGRAM', nome: 'Instagram' },
  INSIGHTS_TIKTOK: { rede: 'TIKTOK', nome: 'TikTok' },
  INSIGHTS_YOUTUBE: { rede: 'YOUTUBE', nome: 'YouTube' },
  INSIGHTS_LINKEDIN: { rede: 'LINKEDIN', nome: 'LinkedIn' },
  INSIGHTS_LINKEDIN_NEWSLETTER: { rede: 'LINKEDIN', nome: 'Newsletter LinkedIn' },
};

export function Insights({ sessao }: Readonly<{ sessao: Sessao }>) {
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
