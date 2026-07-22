import { Page, View, Text, Image } from '@react-pdf/renderer';
import { MidiaKitTemplate, Sessao, parseFotos, parseConfig } from '../../service';
import { Topo, PillRede } from './Compartilhados';
import { resolverEstetica, criarStyles, alturaPagina, PAGE_W, ANO } from './styles';
import { ehUrl } from './analyticsUtils';

export function Capa({ template, sessao }: Readonly<{ template: MidiaKitTemplate; sessao: Sessao }>) {
  const tema = resolverEstetica(sessao);
  const styles = criarStyles(tema);
  const influ = template.influenciador;
  const fotoSessao = parseFotos(sessao.fotos)[0];
  const foto = fotoSessao ?? (ehUrl(influ?.foto) ? influ!.foto! : null); // #1 prioriza foto da seção
  const config = parseConfig(sessao.config);
  const redes = (config.redes ?? []).filter((r) => r.mostrar && (r.seguidores || r.handle));
  const nicho = [influ?.nicho, influ?.subnicho].filter(Boolean).join(' · ');
  const nomeCapa = (config.nomeCapa?.trim() || influ?.nome || template.nome).toUpperCase();

  return (
    <Page size={[PAGE_W, alturaPagina(sessao.tipo, tema)]} style={styles.page}>
      <Topo template={template} styles={styles} tema={tema} />
      <View style={styles.capaBody}>
        <View style={styles.capaMain}>
          <View style={styles.capaInfo}>
            <Text style={styles.capaLabel}>Mídia Kit {ANO}</Text>
            <Text style={styles.capaNome}>{nomeCapa}</Text>
            {nicho ? <Text style={styles.capaNicho}>{nicho}</Text> : null}
          </View>
          {foto && <View style={styles.capaFotoFrame}><Image src={foto} style={styles.capaFoto} /></View>}
        </View>
        <View style={styles.pillsRow}>
          {redes.map((r) => <PillRede key={r.rede} r={r} styles={styles} tema={tema} />)}
        </View>
      </View>
    </Page>
  );
}
