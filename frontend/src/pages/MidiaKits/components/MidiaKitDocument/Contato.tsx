import { Page, View, Text, Link } from '@react-pdf/renderer';
import { MidiaKitTemplate, Sessao, InfluenciadorRef, parseConfig } from '../../service';
import { Topo, IconeRede } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W } from './styles';
import { formatarTelefone } from './analyticsUtils';

export function Contato({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
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
