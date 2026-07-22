import { Page, View, Text, Image } from '@react-pdf/renderer';
import { Sessao, parseFotos, labelTipo } from '../../service';
import { TituloAcento } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W } from './styles';

export function Galeria({ sessao }: Readonly<{ sessao: Sessao }>) {
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
