import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import {
  midiaKitService, Sessao, SessaoConfig, RedeCapa, EsteticaSessao, InfluenciadorRef, MarcaRef, TIPOS_SESSAO, REDES_CAPA,
  labelTipo, requerPrint, comprimirImagem, parseFotos, parseConfig, configPadrao, tituloPadrao, conteudoPadrao, formatarValor, rotularPt,
} from '../../service';
import AssistenteIa from '../../../../components/AssistenteIa';
import ImageCropper from '../../../../components/ImageCropper';
import EsteticaDialog from '../EsteticaDialog';
import './styles.scss';

/** Lê um File como data URL (para alimentar o recortador). */
function lerDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const TIPOS_AUTO = ['CAPA', 'CONTATO'];

export function sessaoVazia(s: Sessao): boolean {
  if (TIPOS_AUTO.includes(s.tipo)) return false;
  const temFoto = parseFotos(s.fotos).length > 0;
  const temTexto = !!s.conteudo && s.conteudo.trim().length > 0;
  const temAnalytics = !!s.analyticsJson && s.analyticsJson.trim().length > 0;
  return !temFoto && !temTexto && !temAnalytics;
}

function labelRede(rede: string): string {
  return REDES_CAPA.find((r) => r.rede === rede)?.label ?? rede;
}

interface SessoesEditorProps {
  sessoes: Sessao[];
  onChange: (sessoes: Sessao[]) => void;
  templateId: string | null;
  influenciador: InfluenciadorRef | null;
  onToast: (severity: 'success' | 'error', detail: string) => void;
}

/** Reduz um array de objetos [{nome, valor}] a pares "nome → valor" para preview. */
function paresDeArray(arr: unknown[]): [string, unknown][] | null {
  const pares: [string, unknown][] = [];
  for (const it of arr) {
    if (!it || typeof it !== 'object' || Array.isArray(it)) return null;
    const o = it as Record<string, unknown>;
    const chaves = Object.keys(o);
    if (!chaves.length) return null;
    const nomeKey = chaves.find((k) => /nome|cidade|label|rotulo|regi|local|pais|estado/i.test(k)) ?? chaves[0];
    const valKey = chaves.find((k) => k !== nomeKey && (typeof o[k] === 'number' || /percent|valor|value|pct|taxa|qtd|total/i.test(k)))
      ?? chaves.find((k) => k !== nomeKey);
    if (valKey == null) return null;
    pares.push([rotularPt(String(o[nomeKey])), o[valKey]]);
  }
  return pares.length ? pares : null;
}

function Par({ chave, valor }: { chave: string; valor: unknown }) {
  return (
    <div className="analytics-item">
      <span className="analytics-key">{chave}</span>
      <span className="analytics-val">{formatarValor(valor)}</span>
    </div>
  );
}

/** Grupo (objeto/lista de objetos) recolhível — começa fechado. */
function Colapsavel({ titulo, children, qtd }: { titulo: string; children: ReactNode; qtd: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="analytics-bloco">
      <button type="button" className="analytics-bloco-tit" onClick={() => setAberto((a) => !a)}>
        <i className={aberto ? 'pi pi-chevron-down' : 'pi pi-chevron-right'} />
        <span>{titulo}</span>
        <span className="analytics-bloco-qtd">{qtd}</span>
      </button>
      {aberto && <div className="analytics-bloco-corpo">{children}</div>}
    </div>
  );
}

/** Renderiza recursivamente escalares/listas/objetos dos analytics de forma legível. */
function AnalyticsNode({ dados }: { dados: Record<string, unknown> }) {
  return (
    <div className="analytics-grupo">
      {Object.entries(dados).map(([k, v]) => {
        if (Array.isArray(v)) {
          const pares = paresDeArray(v);
          if (pares) {
            return (
              <Colapsavel key={k} titulo={rotularPt(k)} qtd={pares.length}>
                {pares.map(([nome, val]) => <Par key={nome} chave={nome} valor={val} />)}
              </Colapsavel>
            );
          }
          return <Par key={k} chave={rotularPt(k)} valor={v.map((x) => formatarValor(x)).join(', ')} />;
        }
        if (v && typeof v === 'object') {
          const sub = v as Record<string, unknown>;
          return (
            <Colapsavel key={k} titulo={rotularPt(k)} qtd={Object.keys(sub).length}>
              <AnalyticsNode dados={sub} />
            </Colapsavel>
          );
        }
        return <Par key={k} chave={rotularPt(k)} valor={v} />;
      })}
    </div>
  );
}

function AnalyticsView({ json }: { json?: string | null }) {
  if (!json) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return <div className="analytics-raw">{json}</div>;
  }
  return <AnalyticsNode dados={obj} />;
}

function CapaRedes({ config, influ, patchConfig }: { config: SessaoConfig; influ: InfluenciadorRef | null; patchConfig: (p: Partial<SessaoConfig>) => void }) {
  const redes: RedeCapa[] = config.redes && config.redes.length ? config.redes : (configPadrao('CAPA', influ).redes ?? []);
  const setRede = (i: number, patch: Partial<RedeCapa>) => {
    patchConfig({ redes: redes.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  };
  return (
    <div className="bloco-config sem-divisor">
      <div className="form-field">
        <label>Nome na capa</label>
        <InputText value={config.nomeCapa ?? ''} onChange={(e) => patchConfig({ nomeCapa: e.target.value })}
          className="w-full" placeholder={influ?.nome ?? 'Nome exibido na capa'} />
        <small className="campo-ajuda">Aparece em destaque na capa. Independe do cadastro do influenciador.</small>
      </div>
      <div className="bloco-head">
        <span>Redes na capa</span>
        {influ && <button type="button" className="btn-puxar" onClick={() => patchConfig({ redes: configPadrao('CAPA', influ).redes })}><i className="pi pi-refresh" /> Puxar do cadastro</button>}
      </div>
      {redes.map((r, i) => (
        <div key={r.rede} className="rede-linha">
          <InputSwitch checked={r.mostrar} onChange={(e) => setRede(i, { mostrar: e.value })} />
          <span className="rede-nome">{labelRede(r.rede)}</span>
          <InputText value={r.handle} onChange={(e) => setRede(i, { handle: e.target.value })} placeholder="@handle" className="rede-in" />
          <InputText value={r.seguidores} onChange={(e) => setRede(i, { seguidores: e.target.value })} placeholder="nº seguidores" className="rede-in" />
          <InputText value={r.url} onChange={(e) => setRede(i, { url: e.target.value })} placeholder="link" className="rede-in" />
        </div>
      ))}
    </div>
  );
}

function ContatoEditor({ config, patchConfig }: { config: SessaoConfig; patchConfig: (p: Partial<SessaoConfig>) => void }) {
  return (
    <div className="bloco-config">
      <div className="bloco-head"><span>Contatos exibidos</span></div>
      <div className="contato-linha">
        <InputSwitch checked={config.mostrarEmail !== false} onChange={(e) => patchConfig({ mostrarEmail: e.value })} />
        <InputText value={config.email ?? ''} onChange={(e) => patchConfig({ email: e.target.value })} placeholder="E-mail" className="w-full" />
      </div>
      <div className="contato-linha">
        <InputSwitch checked={config.mostrarWhatsapp !== false} onChange={(e) => patchConfig({ mostrarWhatsapp: e.value })} />
        <InputText value={config.whatsapp ?? ''} onChange={(e) => patchConfig({ whatsapp: e.target.value })} placeholder="WhatsApp" className="w-full" />
      </div>
    </div>
  );
}

function SessaoCard({ sessao, index, total, templateId, influenciador, marcasDisponiveis, onPatch, onMove, onRemove, onToast }: {
  sessao: Sessao;
  index: number;
  total: number;
  templateId: string | null;
  influenciador: InfluenciadorRef | null;
  marcasDisponiveis: MarcaRef[];
  onPatch: (patch: Partial<Sessao>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onToast: (severity: 'success' | 'error', detail: string) => void;
}) {
  const printRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [prints, setPrints] = useState<File[]>([]);
  const [analisando, setAnalisando] = useState(false);
  const [esteticaAberta, setEsteticaAberta] = useState(false);
  const [cropper, setCropper] = useState<{ src: string; alvo: number | null } | null>(null);
  const usaRecorte = sessao.tipo === 'CAPA' || sessao.tipo === 'SOBRE_INFLUENCIADOR';
  const precisaPrint = requerPrint(sessao.tipo);
  const isInsight = sessao.tipo.startsWith('INSIGHTS_');
  const isConteudos = sessao.tipo === 'CONTEUDOS';
  const isMarcas = sessao.tipo === 'MARCAS';
  const usaLinks = isConteudos || sessao.tipo === 'EXEMPLOS_PUBLIS';
  const podeAnalisar = !!templateId && !!sessao.id;
  const fotos = parseFotos(sessao.fotos);
  const config = parseConfig(sessao.config);
  const links = config.links ?? [];
  const marcasSelecionadas = config.marcas ?? [];
  const vazia = sessaoVazia(sessao);
  const ativa = sessao.ativa !== false;

  const patchConfig = (p: Partial<SessaoConfig>) => onPatch({ config: JSON.stringify({ ...config, ...p }) });

  const analisar = async () => {
    if (!templateId || !sessao.id || prints.length === 0) return;
    setAnalisando(true);
    try {
      const atualizada = await midiaKitService.analisarPrints(templateId, sessao.id, prints, config.comando);
      onPatch({ analyticsJson: atualizada.analyticsJson });
      setPrints([]);
      if (printRef.current) printRef.current.value = '';
      onToast('success', 'Analytics extraídos do print');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message || 'Falha ao analisar print');
    } finally {
      setAnalisando(false);
    }
  };

  const adicionarFotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      if (usaRecorte) {
        // Capa/Sobre: recorta a 1ª foto em quadrado antes de guardar.
        const src = await lerDataUrl(files[0]);
        setCropper({ src, alvo: null });
      } else {
        const novas = await Promise.all(Array.from(files).map((f) => comprimirImagem(f)));
        onPatch({ fotos: JSON.stringify([...fotos, ...novas]) });
      }
    } catch {
      onToast('error', 'Falha ao carregar imagem');
    }
    if (fotoRef.current) fotoRef.current.value = '';
  };

  const aplicarRecorte = (dataUrl: string) => {
    const alvo = cropper?.alvo ?? null;
    const novas = alvo == null ? [...fotos, dataUrl] : fotos.map((f, i) => (i === alvo ? dataUrl : f));
    onPatch({ fotos: JSON.stringify(novas) });
    setCropper(null);
  };

  const removerFoto = (i: number) => {
    onPatch({ fotos: JSON.stringify(fotos.filter((_, idx) => idx !== i)) });
    if (usaLinks) patchConfig({ links: links.filter((_, idx) => idx !== i) });
  };

  const setMarcas = (ids: string[]) => {
    const snapshot = ids
      .map((id) => marcasDisponiveis.find((m) => m.id === id))
      .filter((m): m is MarcaRef => !!m)
      .map(({ id, nome, logotipo }) => ({ id, nome, logotipo }));
    patchConfig({ marcas: snapshot });
  };

  const setLink = (i: number, valor: string) => {
    const arr = [...links];
    arr[i] = valor;
    patchConfig({ links: arr });
  };

  return (
    <div className={`sessao-card ${ativa ? '' : 'inativa'}`}>
      <div className="sessao-head">
        <span className="sessao-tipo">{labelTipo(sessao.tipo)}</span>
        <div className="sessao-head-right">
          <label className="sessao-switch" title="Mostrar no PDF">
            <InputSwitch checked={ativa} onChange={(e) => onPatch({ ativa: e.value })} />
          </label>
          <div className="sessao-acoes">
            <button type="button" className={sessao.estetica ? 'sessao-estetica ativa' : 'sessao-estetica'} onClick={() => setEsteticaAberta(true)} title="Estética da seção"><i className="pi pi-palette" /></button>
            <button type="button" disabled={index === 0} onClick={() => onMove(-1)} title="Subir"><i className="pi pi-chevron-up" /></button>
            <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} title="Descer"><i className="pi pi-chevron-down" /></button>
            <button type="button" className="sessao-remover" onClick={onRemove} title="Remover"><i className="pi pi-trash" /></button>
          </div>
        </div>
      </div>

      {vazia && <div className="sessao-aviso"><i className="pi pi-exclamation-triangle" /> Seção sem conteúdo — adicione texto, fotos ou analytics.</div>}

      {sessao.tipo !== 'CAPA' && (
        <div className="form-field">
          <label>Título</label>
          <InputText value={sessao.titulo ?? ''} onChange={(e) => onPatch({ titulo: e.target.value })} className="w-full" />
        </div>
      )}

      {sessao.tipo !== 'CAPA' && (
        <div className="form-field">
          <div className="label-com-acao">
            <label>Conteúdo</label>
            <AssistenteIa value={sessao.conteudo ?? ''} onResult={(t) => onPatch({ conteudo: t })} label="Editar com IA" />
          </div>
          <InputTextarea value={sessao.conteudo ?? ''} onChange={(e) => onPatch({ conteudo: e.target.value })} rows={3} className="w-full" autoResize />
        </div>
      )}

      {sessao.tipo === 'CAPA' && <CapaRedes config={config} influ={influenciador} patchConfig={patchConfig} />}
      {sessao.tipo === 'CONTATO' && <ContatoEditor config={config} patchConfig={patchConfig} />}

      {isMarcas && (
        <div className="form-field">
          <label>Marcas cadastradas</label>
          <MultiSelect
            value={marcasSelecionadas.map((m) => m.id)} options={marcasDisponiveis}
            optionLabel="nome" optionValue="id" filter display="chip"
            onChange={(e) => setMarcas(e.value)} placeholder="Selecionar marcas..."
            className="w-full" baseZIndex={10000}
            emptyMessage="Nenhuma marca cadastrada"
          />
          <small className="campo-ajuda">Os logos das marcas selecionadas aparecem no PDF. Fotos abaixo são opcionais (extras).</small>
        </div>
      )}

      <div className="sessao-fotos">
        <label>{usaRecorte ? 'Foto' : 'Fotos'}</label>
        <div className="fotos-grid">
          {fotos.map((src, i) => (
            <div key={i} className="foto-thumb">
              <img src={src} alt={`Foto ${i + 1}`} />
              {usaRecorte && (
                <button type="button" className="foto-recortar" onClick={() => setCropper({ src, alvo: i })} title="Recortar"><i className="pi pi-crop" /></button>
              )}
              <button type="button" className="foto-remover" onClick={() => removerFoto(i)} title="Remover"><i className="pi pi-times" /></button>
            </div>
          ))}
          <label className="foto-add">
            <i className="pi pi-plus" />
            <input ref={fotoRef} type="file" accept="image/*" multiple={!usaRecorte} onChange={(e) => adicionarFotos(e.target.files)} />
          </label>
        </div>
      </div>

      <ImageCropper
        visible={!!cropper}
        src={cropper?.src ?? null}
        onCrop={aplicarRecorte}
        onCancel={() => setCropper(null)}
      />

      {usaLinks && fotos.length > 0 && (
        <div className="bloco-config">
          <div className="bloco-head"><span>Link por foto</span></div>
          {fotos.map((src, i) => (
            <div key={i} className="link-foto-linha">
              <img src={src} alt={`Foto ${i + 1}`} />
              <InputText value={links[i] ?? ''} onChange={(e) => setLink(i, e.target.value)} placeholder="https://..." className="w-full" />
            </div>
          ))}
        </div>
      )}

      {isInsight && (
        <div className="form-field">
          <label>Link dos prints originais</label>
          <InputText value={config.linkPrints ?? ''} onChange={(e) => patchConfig({ linkPrints: e.target.value })} className="w-full"
            placeholder="https://drive.google.com/..." />
          <small className="campo-ajuda">Se preenchido, o PDF mostra um link para baixar os prints originais dos insights.</small>
        </div>
      )}

      {precisaPrint && (
        <div className="sessao-print">
          <div className="print-titulo">
            <span><i className="pi pi-sparkles" /> Analisar prints</span>
            <small>Envie os prints e a IA extrai as métricas automaticamente.</small>
          </div>
          {!podeAnalisar && <small className="print-aviso"><i className="pi pi-info-circle" /> Salve o template para habilitar a análise.</small>}
          <div className="print-campo">
            <span className="print-campo-label">Instrução para a IA (opcional)</span>
            <InputTextarea value={config.comando ?? ''} onChange={(e) => patchConfig({ comando: e.target.value })} rows={2} className="w-full"
              placeholder="Ex: extraia apenas seguidores, alcance, engajamento e faixa etária" />
          </div>
          <div className="print-row">
            <input ref={printRef} type="file" accept="image/*" multiple disabled={!podeAnalisar}
              onChange={(e) => setPrints(Array.from(e.target.files ?? []))} />
            <Button label="Analisar" icon="pi pi-sparkles" className="btn-analisar"
              onClick={analisar} loading={analisando} disabled={!podeAnalisar || prints.length === 0} />
          </div>
          {sessao.analyticsJson && (
            <div className="analytics-box">
              <span className="analytics-titulo"><i className="pi pi-check-circle" /> Analytics extraídos</span>
              <AnalyticsView json={sessao.analyticsJson} />
            </div>
          )}
        </div>
      )}

      <EsteticaDialog
        visible={esteticaAberta}
        onHide={() => setEsteticaAberta(false)}
        estetica={sessao.estetica}
        onChange={(estetica: EsteticaSessao | null) => onPatch({ estetica })}
        tituloSecao={labelTipo(sessao.tipo)}
      />
    </div>
  );
}

function SessoesEditor({ sessoes, onChange, templateId, influenciador, onToast }: SessoesEditorProps) {
  const [novoTipo, setNovoTipo] = useState<string | null>(null);
  const [marcasDisponiveis, setMarcasDisponiveis] = useState<MarcaRef[]>([]);

  useEffect(() => {
    let ativo = true;
    midiaKitService.listarMarcas()
      .then((m) => { if (ativo) setMarcasDisponiveis(m); })
      .catch(() => onToast('error', 'Falha ao carregar marcas cadastradas'));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adicionar = () => {
    if (!novoTipo) return;
    onChange([...sessoes, {
      tipo: novoTipo, ordem: sessoes.length, titulo: tituloPadrao(novoTipo, influenciador), ativa: true,
      conteudo: conteudoPadrao(novoTipo), config: JSON.stringify(configPadrao(novoTipo, influenciador)),
    }]);
    setNovoTipo(null);
  };

  const patch = (i: number, p: Partial<Sessao>) => {
    onChange(sessoes.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  };

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sessoes.length) return;
    const copia = [...sessoes];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia.map((s, idx) => ({ ...s, ordem: idx })));
  };

  const remover = (i: number) => {
    onChange(sessoes.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, ordem: idx })));
  };

  return (
    <div className="sessoes-editor">
      <div className="sessoes-add">
        <Dropdown value={novoTipo} options={TIPOS_SESSAO} optionLabel="label" optionValue="tipo"
          onChange={(e) => setNovoTipo(e.value)} placeholder="Adicionar seção..." className="w-full" baseZIndex={10000} />
        <Button label="Adicionar" icon="pi pi-plus" className="btn-add-sessao" onClick={adicionar} disabled={!novoTipo} />
      </div>

      {sessoes.length === 0 && <p className="sessoes-vazio">Nenhuma seção. Adicione acima.</p>}

      {sessoes.map((s, i) => (
        <SessaoCard key={s.id ?? `nova-${i}`} sessao={s} index={i} total={sessoes.length} templateId={templateId} influenciador={influenciador}
          marcasDisponiveis={marcasDisponiveis}
          onPatch={(p) => patch(i, p)} onMove={(d) => mover(i, d)} onRemove={() => remover(i)} onToast={onToast} />
      ))}
    </div>
  );
}

export default SessoesEditor;
