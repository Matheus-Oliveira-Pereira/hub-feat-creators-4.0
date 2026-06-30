import { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import FormDialog from '../../../../components/FormDialog';
import {
  Entregavel,
  FormatoRef,
  StatusEntregavel,
  STATUS_ENTREGAVEL_LABEL,
} from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  onSave: (e: Entregavel) => void;
  formatos: FormatoRef[];
  inicial: Entregavel | null;
}

const STATUS_OPTIONS = (Object.keys(STATUS_ENTREGAVEL_LABEL) as StatusEntregavel[])
  .map((s) => ({ label: STATUS_ENTREGAVEL_LABEL[s], value: s }));

function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().split('T')[0];
}

function EntregavelDialog({ visible, onHide, onSave, formatos, inicial }: Readonly<Props>) {
  const [formatoId, setFormatoId] = useState<string | null>(null);
  const [escopo, setEscopo] = useState('');
  const [dataEntrega, setDataEntrega] = useState<Date | null>(null);
  const [status, setStatus] = useState<StatusEntregavel>('PRODUCAO');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    setFormatoId(inicial?.formato?.id ?? null);
    setEscopo(inicial?.escopo ?? '');
    setDataEntrega(inicial?.dataEntrega ? new Date(inicial.dataEntrega + 'T00:00:00') : null);
    setStatus(inicial?.status ?? 'PRODUCAO');
  }, [visible, inicial]);

  const formatoOptions = formatos.map((f) => ({ label: f.descricao, value: f.id }));

  const salvar = () => {
    setSubmitted(true);
    if (!formatoId) return;
    onSave({
      ...(inicial ?? {}),
      formato: { id: formatoId, descricao: formatos.find((f) => f.id === formatoId)?.descricao ?? '' },
      escopo: escopo.trim(),
      dataEntrega: dateToIso(dataEntrega),
      status,
    });
  };

  return (
    <FormDialog
      visible={visible}
      onHide={onHide}
      title={inicial ? 'Editar entregável' : 'Novo entregável'}
      icon={inicial ? 'pi pi-pencil' : 'pi pi-plus'}
      onSave={salvar}
      width="560px"
    >
      <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className={`form-field ${submitted && !formatoId ? 'field-error' : ''}`} style={{ flex: 1 }}>
          <label htmlFor="ent-formato">Formato <span className="required">*</span></label>
          <Dropdown id="ent-formato" value={formatoId} options={formatoOptions} onChange={(e) => setFormatoId(e.value)} placeholder="Selecione" filter className="w-full" baseZIndex={11000} />
          {submitted && !formatoId && <small className="p-error"><i className="pi pi-exclamation-circle" /> Selecione o formato</small>}
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="ent-status">Status</label>
          <Dropdown id="ent-status" value={status} options={STATUS_OPTIONS} onChange={(e) => setStatus(e.value)} className="w-full" baseZIndex={11000} />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="ent-escopo">Escopo</label>
        <InputTextarea id="ent-escopo" value={escopo} onChange={(e) => setEscopo(e.target.value)} rows={5} className="w-full" autoResize placeholder="Descreva o que será entregue, requisitos, links, briefing..." />
      </div>

      <div className="form-field">
        <label htmlFor="ent-data">Data de entrega</label>
        <Calendar
          inputId="ent-data"
          value={dataEntrega}
          onChange={(e) => setDataEntrega(e.value as Date)}
          dateFormat="dd/mm/yy"
          showIcon
          showButtonBar
          readOnlyInput
          placeholder="Selecione a data"
          className="w-full"
          baseZIndex={11000}
        />
      </div>
    </FormDialog>
  );
}

export default EntregavelDialog;
