import { Page, View, Text, Image, Link } from '@react-pdf/renderer';
import { Sessao, parseFotos, parseConfig, garantirUrl, formatoDaFoto } from '../../service';
import { TituloAcento } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W, DIM_FORMATO } from './styles';

export function Conteudos({ sessao }: Readonly<{ sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const fotos = parseFotos(sessao.fotos);
  const config = parseConfig(sessao.config);
  const links = config.links ?? [];
  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <View style={styles.secaoHead}>
        <TituloAcento texto={sessao.titulo || 'Conteúdos recentes'} styles={styles} />
      </View>
      <Text style={styles.subtitulo}>{sessao.conteudo || 'Clique nas imagens para assistir aos vídeos.'}</Text>
      <View style={styles.conteudosCenter}>
        <View style={styles.cardsRow}>
          {fotos.map((src, i) => {
            const dim = DIM_FORMATO[formatoDaFoto(config, i)];
            const card = <Image src={src} style={[styles.conteudoCard, { width: dim.w * tema.escala, height: dim.h * tema.escala }]} />;
            const url = garantirUrl(links[i]);
            return url ? <Link key={src.slice(-16)} src={url}>{card}</Link> : <View key={src.slice(-16)}>{card}</View>;
          })}
        </View>
      </View>
    </Page>
  );
}
