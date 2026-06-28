import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import {
  Entregavel,
  FormatoRef,
  StatusEntregavel,
  STATUS_ENTREGAVEL_LABEL,
} from '../../service';
import './styles.scss';

interface Props {
  entregaveis: Entregavel[];
  formatos: FormatoRef[];
  onChange: (e: Entregavel[]) => void;
}

const STATUS_OPTIONS = (Object.keys(STATUS_ENTREGAVEL_LABEL) as StatusEntregavel[])
  .map((s) => ({ label: STATUS_ENTREGAVEL_LABEL[s], value: s }));

const NOVO: Entregavel = { status: 'PRODUCAO', escopo: '', dataEntrega: null, formato: null };

function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().split('T')[0];
}

function EntregaveisEditor({ entregaveis, formatos, onChange }: Readonly<Props>) {
  const patch = (i: number, p: Partial<Entregavel>) =>
    onChange(entregaveis.map((e, idx) => (idx === i ? { ...e, ...p } : e)));

  const adicionar = () => onChange([...entregaveis, { ...NOVO }]);
  const remover = (i: number) => onChange(entregaveis.filter((_, idx) => idx !== i));

  const formatoOptions = formatos.map((f) => ({ label: f.descricao, value: f.id }));

  return (
    <div className="entregaveis-editor">
      <div className="entregaveis-head">
        <span>Entregáveis</span>
        <Button label="Adicionar entregável" icon="pi pi-plus" className="btn-add-entregavel" type="button" onClick={adicionar} />
      </div>

      {entregaveis.length === 0 && <p className="entregaveis-vazio">Nenhum entregável. Adicione acima.</p>}

      {entregaveis.map((e, i) => (
        <div key={e.id ?? `novo-${i}`} className="entregavel-linha">
          <Dropdown
            value={e.formato?.id ?? null}
            options={formatoOptions}
            onChange={(ev) => patch(i, { formato: ev.value ? { id: ev.value, descricao: formatos.find((f) => f.id === ev.value)?.descricao ?? '' } : null })}
            placeholder="Formato"
            filter
            className="ent-formato"
            baseZIndex={10000}
          />
          <InputText value={e.escopo} onChange={(ev) => patch(i, { escopo: ev.target.value })} placeholder="Escopo" className="ent-escopo" />
          <Calendar
            value={e.dataEntrega ? new Date(e.dataEntrega + 'T00:00:00') : null}
            onChange={(ev) => patch(i, { dataEntrega: dateToIso(ev.value as Date) })}
            placeholder="Entrega"
            dateFormat="dd/mm/yy"
            showIcon
            className="ent-data"
            baseZIndex={10000}
          />
          <Dropdown value={e.status} options={STATUS_OPTIONS} onChange={(ev) => patch(i, { status: ev.value })} className="ent-status" baseZIndex={10000} />
          <button type="button" className="ent-remover" onClick={() => remover(i)} title="Remover"><i className="pi pi-trash" /></button>
        </div>
      ))}
    </div>
  );
}

export default EntregaveisEditor;
