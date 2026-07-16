import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { EsteticaSessao, ESTETICA_PADRAO } from '../../service';
import './styles.scss';

/** Valores padrão compartilhados com o PDF — placeholders quando o campo está vazio. */
const PADRAO = ESTETICA_PADRAO;

const FONTES = [
  { label: 'Archivo Black (padrão)', value: 'Heading' },
  { label: 'Helvetica Bold', value: 'Helvetica-Bold' },
  { label: 'Helvetica', value: 'Helvetica' },
];

const ALINHAMENTOS = [
  { label: 'Esquerda', value: 'left' },
  { label: 'Centro', value: 'center' },
  { label: 'Direita', value: 'right' },
];

const CORES: { campo: keyof EsteticaSessao; label: string }[] = [
  { campo: 'corFundo', label: 'Fundo' },
  { campo: 'corDestaque', label: 'Destaque' },
  { campo: 'corTexto', label: 'Texto' },
  { campo: 'corTextoSecundario', label: 'Texto secundário' },
  { campo: 'corCard', label: 'Card' },
  { campo: 'corBorda', label: 'Borda' },
];

type NumDef = { campo: keyof EsteticaSessao; label: string; unidade: string; min?: number; max?: number };

const NUMEROS_TIPO: NumDef[] = [
  { campo: 'tamanhoNomeCapa', label: 'Nome na capa', unidade: 'px', min: 12, max: 120 },
  { campo: 'tamanhoTitulo', label: 'Título', unidade: 'px', min: 10, max: 96 },
  { campo: 'tamanhoTexto', label: 'Texto', unidade: 'px', min: 6, max: 40 },
];

const NUMEROS_LAYOUT: NumDef[] = [
  { campo: 'escalaFotos', label: 'Tamanho das fotos', unidade: '%', min: 20, max: 300 },
  { campo: 'paddingPagina', label: 'Margem da página', unidade: 'px', min: 0, max: 120 },
  { campo: 'alturaPagina', label: 'Altura da página', unidade: 'px', min: 300, max: 1200 },
  { campo: 'gapCards', label: 'Espaço entre cards', unidade: 'px', min: 0, max: 60 },
  { campo: 'raioBorda', label: 'Arredondamento', unidade: 'px', min: 0, max: 40 },
];

interface Props {
  visible: boolean;
  onHide: () => void;
  estetica?: EsteticaSessao | null;
  onChange: (estetica: EsteticaSessao | null) => void;
  tituloSecao: string;
}

/** Remove chaves vazias/undefined; retorna null se não sobrar nenhuma (usa tudo padrão). */
function limpar(e: EsteticaSessao): EsteticaSessao | null {
  const out: Record<string, unknown> = {};
  (Object.keys(e) as (keyof EsteticaSessao)[]).forEach((k) => {
    const v = e[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return Object.keys(out).length ? (out as EsteticaSessao) : null;
}

function EsteticaDialog({ visible, onHide, estetica, onChange, tituloSecao }: Readonly<Props>) {
  const [draft, setDraft] = useState<EsteticaSessao>(estetica ?? {});

  useEffect(() => {
    if (visible) setDraft(estetica ?? {});
  }, [visible, estetica]);

  const set = (campo: keyof EsteticaSessao, valor: string | number | null | undefined) => {
    setDraft((d) => {
      const novo: Record<string, unknown> = { ...d };
      if (valor === undefined || valor === null || valor === '') delete novo[campo];
      else novo[campo] = valor;
      return novo as EsteticaSessao;
    });
  };

  const aplicar = () => { onChange(limpar(draft)); onHide(); };
  const restaurar = () => { setDraft({}); };

  const corRow = ({ campo, label }: { campo: keyof EsteticaSessao; label: string }) => {
    const atual = (draft[campo] as string | undefined) ?? '';
    const padrao = (PADRAO[campo as keyof typeof PADRAO] as string) ?? '#000000';
    return (
      <div className="est-cor-row" key={campo}>
        <span className="est-cor-label">{label}</span>
        <input type="color" value={atual || padrao} onChange={(e) => set(campo, e.target.value)} title={label} />
        <InputText value={atual} onChange={(e) => set(campo, e.target.value)} placeholder={padrao} className="est-cor-hex" />
        {atual && <button type="button" className="est-limpar" onClick={() => set(campo, undefined)} title="Usar padrão"><i className="pi pi-times" /></button>}
      </div>
    );
  };

  const numRow = ({ campo, label, unidade, min, max }: NumDef) => {
    const atual = draft[campo] as number | undefined;
    const padrao = PADRAO[campo as keyof typeof PADRAO] as number;
    return (
      <div className="est-num-row" key={campo}>
        <span className="est-num-label">{label}</span>
        <div className="est-num-campo">
          <InputNumber value={atual ?? null} onValueChange={(e) => set(campo, e.value ?? undefined)}
            placeholder={String(padrao)} suffix={` ${unidade}`} min={min ?? 0} max={max}
            showButtons buttonLayout="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
            className="est-num-in" inputClassName="est-num-input" />
          {atual != null && <button type="button" className="est-limpar" onClick={() => set(campo, undefined)} title="Usar padrão"><i className="pi pi-times" /></button>}
        </div>
      </div>
    );
  };

  const footer = (
    <div className="est-footer">
      <Button label="Restaurar padrão" icon="pi pi-refresh" className="p-button-text" onClick={restaurar} />
      <span className="est-footer-spacer" />
      <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} />
      <Button label="Aplicar" icon="pi pi-check" onClick={aplicar} />
    </div>
  );

  return (
    <Dialog
      header={<span><i className="pi pi-palette" /> Estética — {tituloSecao}</span>}
      visible={visible}
      onHide={onHide}
      footer={footer}
      style={{ width: '620px' }}
      modal
      draggable={false}
      baseZIndex={10000}
      className="estetica-dialog"
    >
      <p className="est-ajuda"><i className="pi pi-info-circle" /> Tudo é opcional. Campos vazios usam o padrão do template.</p>
      <Accordion multiple activeIndex={[0]}>
        <AccordionTab header="Cores">
          <div className="est-cores-grid">{CORES.map(corRow)}</div>
        </AccordionTab>

        <AccordionTab header="Tipografia">
          <div className="est-num-row">
            <span className="est-num-label">Fonte do título</span>
            <Dropdown value={draft.fonteTitulo ?? null} options={FONTES} onChange={(e) => set('fonteTitulo', e.value)}
              placeholder="Padrão" showClear className="est-drop" baseZIndex={11000} />
          </div>
          {NUMEROS_TIPO.map(numRow)}
        </AccordionTab>

        <AccordionTab header="Layout e espaçamento">
          {NUMEROS_LAYOUT.map(numRow)}
        </AccordionTab>

        <AccordionTab header="Alinhamento">
          <div className="est-num-row">
            <span className="est-num-label">Título</span>
            <SelectButton value={draft.alinhamentoTitulo ?? 'left'} options={ALINHAMENTOS}
              onChange={(e) => set('alinhamentoTitulo', e.value ?? undefined)} allowEmpty={false} />
          </div>
          <div className="est-num-row">
            <span className="est-num-label">Conteúdo</span>
            <SelectButton value={draft.alinhamentoConteudo ?? 'left'} options={ALINHAMENTOS}
              onChange={(e) => set('alinhamentoConteudo', e.value ?? undefined)} allowEmpty={false} />
          </div>
        </AccordionTab>
      </Accordion>
    </Dialog>
  );
}

export default EsteticaDialog;
