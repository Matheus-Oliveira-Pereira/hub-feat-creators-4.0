import { useState, useEffect } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import FormDialog from '../../../../components/FormDialog';
import ConfirmDialog from '../../../../components/ConfirmDialog';

interface Props {
  visible: boolean;
  onHide: () => void;
  onConfirm: (motivo: string) => void;
  loading?: boolean;
}

function EncerramentoDialog({ visible, onHide, onConfirm, loading }: Readonly<Props>) {
  const [motivo, setMotivo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (visible) { setMotivo(''); setSubmitted(false); setConfirmVisible(false); }
  }, [visible]);

  const confirmar = () => {
    setSubmitted(true);
    if (!motivo.trim()) return;
    setConfirmVisible(true);
  };

  return (
    <>
      <FormDialog
        visible={visible}
        onHide={onHide}
        title="Encerrar Prospecção"
        icon="pi pi-flag"
        onSave={confirmar}
        loading={loading}
        width="480px"
      >
        <div className={`form-field ${submitted && !motivo.trim() ? 'field-error' : ''}`}>
          <label htmlFor="motivo">Motivo do encerramento <span className="required">*</span></label>
          <InputTextarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="w-full" autoResize placeholder="Ex: sem orçamento, sem resposta, declinou..." />
          {submitted && !motivo.trim() && <small className="p-error"><i className="pi pi-exclamation-circle" /> Informe o motivo</small>}
        </div>
      </FormDialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        onConfirm={() => { setConfirmVisible(false); onConfirm(motivo.trim()); }}
        title="Confirmar encerramento"
        icon="pi pi-flag"
        message="Deseja encerrar esta prospecção com o motivo informado?"
        confirmLabel="Encerrar"
        confirmIcon="pi pi-flag"
        confirmSeverity="warning"
      />
    </>
  );
}

export default EncerramentoDialog;
