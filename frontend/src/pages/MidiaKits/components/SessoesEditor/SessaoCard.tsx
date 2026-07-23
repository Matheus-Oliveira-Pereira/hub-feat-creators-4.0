import { useState, useRef } from 'react';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import {
  midiaKitService, Sessao, SessaoConfig, EsteticaSessao, InfluenciadorRef, MarcaRef,
  labelTipo, requerPrint, comprimirImagem, parseFotos, parseConfig, sessaoVazia,
  LAYOUTS_FOTOS, FORMATOS_FOTO,
} from '../../service';
import { iaService } from '../../../../services/iaService';
import AssistenteIa from '../../../../components/AssistenteIa';
import ImageCropper from '../../../../components/ImageCropper';
import SelectComCadastro from '../../../../components/SelectComCadastro';
import { useAuth } from '../../../../contexts/AuthContext';
import { canAdd, MODULES } from '../../../../utils/roles';
import MarcaFormDialog from '../../../Marcas/components/MarcaFormDialog';
import EsteticaDialog from '../EsteticaDialog';
import AnalyticsView from './AnalyticsView';
import { CapaRedes, ContatoEditor } from './ConfigEditores';

/** Lê um File como data URL (para alimentar o recortador). */
function lerDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Dimensões naturais de uma imagem (data URL). */
function dimensoes(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = reject;
    img.src = src;
  });
}

const LADO_MINIMO_RECOMENDADO = 600; // abaixo disso a foto tende a pixelar no PDF

function dataCurta(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
}

export interface SessaoCardProps {
  sessao: Sessao;
  index: number;
  total: number;
  templateId: string | null;
  influenciador: InfluenciadorRef | null;
  marcasDisponiveis: MarcaRef[];
  recarregarMarcas: () => Promise<MarcaRef[]>;
  onPatch: (patch: Partial<Sessao>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDropOn: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
}

function SessaoCard({ sessao, index, total, templateId, influenciador, marcasDisponiveis, recarregarMarcas, onPatch, onMove, onRemove, onDuplicate, onDragStart, onDropOn, onToast }: Readonly<SessaoCardProps>) {
  const { user: authUser } = useAuth();
  const printRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [prints, setPrints] = useState<File[]>([]);
  const [analisando, setAnalisando] = useState(false);
  const [gerandoSobre, setGerandoSobre] = useState(false);
  const [esteticaAberta, setEsteticaAberta] = useState(false);
  const [marcaDialogVisible, setMarcaDialogVisible] = useState(false);
  const [cropper, setCropper] = useState<{ src: string; alvo: number | null } | null>(null);
  const podeAddMarca = canAdd(authUser?.roles ?? [], MODULES.MARCAS.prefix);
  // Seções iniciam recolhidas; estado local por card (preservado em reordenação de seções salvas).
  const [expandida, setExpandida] = useState(false);
  const usaRecorte = sessao.tipo === 'CAPA' || sessao.tipo === 'SOBRE_INFLUENCIADOR';
  const isSobre = sessao.tipo === 'SOBRE_INFLUENCIADOR';
  const precisaPrint = requerPrint(sessao.tipo);
  const isInsight = sessao.tipo.startsWith('INSIGHTS_');
  const isConteudos = sessao.tipo === 'CONTEUDOS';
  const isMarcas = sessao.tipo === 'MARCAS';
  const usaLinks = isConteudos || sessao.tipo === 'EXEMPLOS_PUBLIS';
  const podeAnalisar = !!templateId && !!sessao.id;
  const fotos = parseFotos(sessao.fotos);
  const config = parseConfig(sessao.config);
  const links = config.links ?? [];
  const layoutFotos = config.layoutFotos ?? 'VERTICAL';
  const formatosFotos = config.formatosFotos ?? [];
  const layoutHibrido = layoutFotos === 'HIBRIDO';
  const marcasSelecionadas = config.marcas ?? [];
  const vazia = sessaoVazia(sessao);
  const ativa = sessao.ativa !== false;
  const analisadoEm = dataCurta(config.analisadoEm);

  const patchConfig = (p: Partial<SessaoConfig>) => onPatch({ config: JSON.stringify({ ...config, ...p }) });

  const analisar = async () => {
    if (!templateId || !sessao.id || prints.length === 0) return;
    setAnalisando(true);
    try {
      const atualizada = await midiaKitService.analisarPrints(templateId, sessao.id, prints, config.comando);
      onPatch({
        analyticsJson: atualizada.analyticsJson,
        config: JSON.stringify({ ...config, analisadoEm: new Date().toISOString() }),
      });
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

  const avisarBaixaResolucao = async (src: string) => {
    try {
      const { w, h } = await dimensoes(src);
      if (Math.min(w, h) < LADO_MINIMO_RECOMENDADO) {
        onToast('warn', `Foto pequena (${w}×${h}px) — pode ficar pixelada no PDF. Ideal: ${LADO_MINIMO_RECOMENDADO}px ou mais.`);
      }
    } catch { /* aviso é best-effort */ }
  };

  const adicionarFotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      if (usaRecorte) {
        // Capa/Sobre: recorta a 1ª foto em quadrado antes de guardar.
        const src = await lerDataUrl(files[0]);
        await avisarBaixaResolucao(src);
        setCropper({ src, alvo: null });
      } else {
        const srcs = await Promise.all(Array.from(files).map((f) => lerDataUrl(f)));
        await Promise.all(srcs.map((s) => avisarBaixaResolucao(s)));
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
    if (usaLinks) {
      patchConfig({
        links: links.filter((_, idx) => idx !== i),
        formatosFotos: formatosFotos.filter((_, idx) => idx !== i),
      });
    }
  };

  const setFormatoFoto = (i: number, valor: string) => {
    const arr = fotos.map((_, idx) => formatosFotos[idx] ?? 'VERTICAL');
    arr[i] = valor;
    patchConfig({ formatosFotos: arr });
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

  /** Gera o texto do "Sobre" a partir dos dados cadastrais do influenciador. */
  const gerarSobre = async () => {
    if (!influenciador) return;
    setGerandoSobre(true);
    try {
      const dados = [
        `Nome: ${influenciador.nome}`,
        influenciador.nicho && `Nicho: ${influenciador.nicho}${influenciador.subnicho ? ` / ${influenciador.subnicho}` : ''}`,
        influenciador.instagram && `Instagram: ${influenciador.instagram}`,
        influenciador.tiktok && `TikTok: ${influenciador.tiktok}`,
        influenciador.youtube && `YouTube: ${influenciador.youtube}`,
        influenciador.linkedin && `LinkedIn: ${influenciador.linkedin}`,
      ].filter(Boolean).join('\n');
      const texto = await iaService.editarTexto(
        dados,
        'Escreva 2 a 3 parágrafos de apresentação deste influenciador para um mídia kit enviado a marcas. '
        + 'Tom profissional e vendedor, em português do Brasil. Responda apenas com os parágrafos, sem título.',
      );
      onPatch({ conteudo: texto });
      onToast('success', 'Texto gerado pela IA — revise antes de salvar');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message || 'Falha ao gerar texto');
    } finally {
      setGerandoSobre(false);
    }
  };

  return (
    <div
      className={`sessao-card ${ativa ? '' : 'inativa'}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropOn(); }}
    >
      <div className="sessao-head clicavel" onClick={() => setExpandida(!expandida)} title={expandida ? 'Recolher seção' : 'Expandir seção'}>
        <span
          className="sessao-arrastar"
          title="Arrastar para reordenar"
          draggable
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
        >
          <i className="pi pi-bars" />
        </span>
        <i className={`pi ${expandida ? 'pi-chevron-down' : 'pi-chevron-right'} sessao-chevron`} />
        <span className="sessao-tipo">{labelTipo(sessao.tipo)}</span>
        <div className="sessao-head-right" onClick={(e) => e.stopPropagation()}>
          <label className="sessao-switch" title="Mostrar no PDF">
            <InputSwitch checked={ativa} onChange={(e) => onPatch({ ativa: e.value })} />
          </label>
          <div className="sessao-acoes">
            <button type="button" className={sessao.estetica ? 'sessao-estetica ativa' : 'sessao-estetica'} onClick={() => setEsteticaAberta(true)} title="Estética da seção"><i className="pi pi-palette" /></button>
            <button type="button" onClick={onDuplicate} title="Duplicar seção"><i className="pi pi-clone" /></button>
            <button type="button" disabled={index === 0} onClick={() => onMove(-1)} title="Subir"><i className="pi pi-chevron-up" /></button>
            <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} title="Descer"><i className="pi pi-chevron-down" /></button>
            <button type="button" className="sessao-remover" onClick={onRemove} title="Remover"><i className="pi pi-trash" /></button>
          </div>
        </div>
      </div>

      {vazia && <div className="sessao-aviso"><i className="pi pi-exclamation-triangle" /> Seção sem conteúdo — adicione texto, fotos ou analytics.</div>}

      {expandida && (<>
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
            <div className="label-acoes">
              {isSobre && influenciador && (
                <button type="button" className="assistente-ia-btn" onClick={gerarSobre} disabled={gerandoSobre} title="Gerar texto a partir do cadastro do influenciador">
                  <i className={gerandoSobre ? 'pi pi-spin pi-spinner' : 'pi pi-bolt'} /> Gerar com IA
                </button>
              )}
              <AssistenteIa value={sessao.conteudo ?? ''} onResult={(t) => onPatch({ conteudo: t })} label="Editar com IA" />
            </div>
          </div>
          <InputTextarea value={sessao.conteudo ?? ''} onChange={(e) => onPatch({ conteudo: e.target.value })} rows={3} className="w-full" autoResize />
        </div>
      )}

      {sessao.tipo === 'CAPA' && <CapaRedes config={config} influ={influenciador} patchConfig={patchConfig} />}
      {sessao.tipo === 'CONTATO' && <ContatoEditor config={config} patchConfig={patchConfig} />}

      {isMarcas && (
        <div className="form-field">
          <label>Marcas cadastradas</label>
          <SelectComCadastro onAdd={() => setMarcaDialogVisible(true)} visivel={podeAddMarca} title="Cadastrar nova marca">
            <MultiSelect
              value={marcasSelecionadas.map((m) => m.id)} options={marcasDisponiveis}
              optionLabel="nome" optionValue="id" filter display="chip"
              onChange={(e) => setMarcas(e.value)} placeholder="Selecionar marcas..."
              className="w-full" baseZIndex={10000}
              emptyMessage="Nenhuma marca cadastrada"
            />
          </SelectComCadastro>
          <small className="campo-ajuda">Os logos das marcas selecionadas aparecem no PDF. Fotos abaixo são opcionais (extras).</small>
          <MarcaFormDialog
            visible={marcaDialogVisible}
            onHide={() => setMarcaDialogVisible(false)}
            onSaved={async (marca) => {
              const lista = await recarregarMarcas();
              const ids = [...marcasSelecionadas.map((m) => m.id), marca.id];
              const snapshot = ids
                .map((id) => lista.find((m) => m.id === id))
                .filter((m): m is MarcaRef => !!m)
                .map(({ id, nome, logotipo }) => ({ id, nome, logotipo }));
              patchConfig({ marcas: snapshot });
            }}
          />
        </div>
      )}

      {usaLinks && (
        <div className="form-field">
          <label>Layout das fotos</label>
          <Dropdown
            value={layoutFotos} options={LAYOUTS_FOTOS}
            optionLabel="label" optionValue="valor"
            onChange={(e) => patchConfig({ layoutFotos: e.value })}
            className="w-full" baseZIndex={10000}
          />
          <small className="campo-ajuda">Define a proporção das fotos no PDF. Híbrido permite escolher o formato de cada foto.</small>
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
          <div className="bloco-head"><span>{layoutHibrido ? 'Link e formato por foto' : 'Link por foto'}</span></div>
          {fotos.map((src, i) => (
            <div key={i} className="link-foto-linha">
              <img src={src} alt={`Foto ${i + 1}`} />
              <InputText value={links[i] ?? ''} onChange={(e) => setLink(i, e.target.value)} placeholder="https://..." className="w-full" />
              {layoutHibrido && (
                <Dropdown
                  value={formatosFotos[i] ?? 'VERTICAL'} options={FORMATOS_FOTO}
                  optionLabel="label" optionValue="valor"
                  onChange={(e) => setFormatoFoto(i, e.value)}
                  className="formato-foto-dropdown" baseZIndex={10000}
                />
              )}
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
              <span className="analytics-titulo">
                <i className="pi pi-check-circle" /> Analytics extraídos
                {analisadoEm && <small className="analytics-data">em {analisadoEm}</small>}
              </span>
              <AnalyticsView json={sessao.analyticsJson} />
            </div>
          )}
        </div>
      )}
      </>)}

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

export default SessaoCard;
