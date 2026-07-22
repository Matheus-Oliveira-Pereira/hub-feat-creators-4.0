import { Page, View, Text, Image } from '@react-pdf/renderer';
import { Sessao, parseFotos } from '../../service';
import { TituloAcento } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W } from './styles';

export function Sobre({ sessao }: Readonly<{ sessao: Sessao }>) {
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
