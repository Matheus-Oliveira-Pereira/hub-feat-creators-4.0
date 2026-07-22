import { Text, View, Svg, Path, Link } from '@react-pdf/renderer';
import { MidiaKitTemplate, RedeCapa, formatarValor, garantirUrl } from '../../service';
import { SOCIAL_ICONS } from './socialIcons';
import { LOGO_PATHS, LOGO_VIEWBOX } from './logo';
import { Tema, Styles, TEMA_PADRAO, stylesPadrao, ANO } from './styles';
import { ehPctGrupo, arrayObjParaRecord, pctInfo, rotular, rotularChave } from './analyticsUtils';

// Nomenclatura da contagem por rede (após o número, na capa).
const NOME_SEGUIDORES: Record<string, string> = {
  INSTAGRAM: 'seguidores',
  TIKTOK: 'seguidores',
  LINKEDIN: 'seguidores',
  YOUTUBE: 'inscritos',
  DISCORD: 'membros',
};

export function LogoFeat({ tema = TEMA_PADRAO }: Readonly<{ tema?: Tema }>) {
  return (
    <Svg width={134} height={36} viewBox={LOGO_VIEWBOX} style={stylesPadrao.logo}>
      {LOGO_PATHS.map((p) => <Path key={p.d.slice(0, 24)} d={p.d} fill={p.lime ? tema.lime : tema.text} />)}
    </Svg>
  );
}

export function IconeRede({ rede, size = 14, color = TEMA_PADRAO.lime }: Readonly<{ rede: string; size?: number; color?: string }>) {
  const d = SOCIAL_ICONS[rede];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} />
    </Svg>
  );
}

export function TituloAcento({ texto, styles, base }: Readonly<{ texto: string; styles: Styles; base?: typeof styles.titulo }>) {
  const estilo = base ?? styles.titulo;
  const palavras = (texto ?? '').trim().split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return <Text style={estilo}>{texto}</Text>;
  const ultima = palavras.pop();
  return <Text style={estilo}>{palavras.join(' ')} <Text style={styles.tituloLime}>{ultima}</Text></Text>;
}

export function PillRede({ r, styles, tema }: Readonly<{ r: RedeCapa; styles: Styles; tema: Tema }>) {
  const nomenclatura = NOME_SEGUIDORES[r.rede] ?? 'seguidores';
  const inner = (
    <>
      <View style={styles.pillIcon}><IconeRede rede={r.rede} size={11} color={tema.lime} /></View>
      <Text style={styles.pillVal}>{r.seguidores || r.handle}</Text>
      {r.seguidores ? <Text style={styles.pillNome}>{nomenclatura}</Text> : null}
    </>
  );
  if (r.url) return <Link src={garantirUrl(r.url)} style={styles.pill}>{inner}</Link>;
  return <View style={styles.pill}>{inner}</View>;
}

export function Topo({ template, styles, tema }: Readonly<{ template: MidiaKitTemplate; styles: Styles; tema: Tema }>) {
  return (
    <View style={styles.topbar}>
      <LogoFeat tema={tema} />
      <Text style={styles.topRight}>Mídia Kit {template.influenciador?.nome ?? template.nome} {ANO}</Text>
    </View>
  );
}

export function ConteudoObjeto({ obj, styles }: Readonly<{ obj: Record<string, unknown>; styles: Styles }>) {
  const pctGrupo = ehPctGrupo(obj);
  return (
    <>
      {Object.entries(obj).map(([sk, sv]) => {
        if (Array.isArray(sv)) {
          const rec = arrayObjParaRecord(sv);
          if (rec) {
            return (
              <View key={sk} style={styles.subGrupo}>
                <Text style={styles.subGrupoTit}>{rotular(sk)}</Text>
                <ConteudoObjeto obj={rec} styles={styles} />
              </View>
            );
          }
          return (
            <View key={sk} style={styles.demoItem}>
              <Text style={styles.demoKey}>{rotular(sk)}: {sv.map((x) => formatarValor(x)).join(', ')}</Text>
            </View>
          );
        }
        if (sv && typeof sv === 'object') {
          return (
            <View key={sk} style={styles.subGrupo}>
              <Text style={styles.subGrupoTit}>{rotular(sk)}</Text>
              <ConteudoObjeto obj={sv as Record<string, unknown>} styles={styles} />
            </View>
          );
        }
        const { display, largura } = pctInfo(sv, pctGrupo);
        return (
          <View key={sk} style={styles.demoItem}>
            <View style={styles.demoItemHead}>
              <Text style={styles.demoKey}>{rotularChave(sk)}</Text>
              <Text style={styles.demoVal}>{display}</Text>
            </View>
            {largura ? <View style={styles.barTrack}><View style={[styles.barFill, { width: largura }]} /></View> : null}
          </View>
        );
      })}
    </>
  );
}
