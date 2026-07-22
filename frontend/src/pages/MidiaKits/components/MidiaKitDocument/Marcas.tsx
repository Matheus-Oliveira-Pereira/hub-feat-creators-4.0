import { Page, View, Text, Image } from '@react-pdf/renderer';
import { Sessao, parseConfig, parseFotos, labelTipo } from '../../service';
import { TituloAcento } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W } from './styles';
import { ehUrl } from './analyticsUtils';

export function Marcas({ sessao }: Readonly<{ sessao: Sessao }>) {
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
