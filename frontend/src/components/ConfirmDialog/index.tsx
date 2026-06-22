import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface ConfirmDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  icon: string;
  message: string;
  confirmLabel?: string;
  confirmIcon?: string;
  confirmSeverity?: 'danger' | 'success' | 'info' | 'warning' | 'help' | 'secondary';
  className?: string;
}

function ConfirmDialog({ visible, onHide, onConfirm, title, icon, message, confirmLabel = 'Confirmar', confirmIcon = 'pi pi-check', confirmSeverity = 'danger', className }: ConfirmDialogProps) {
  const header = (
    <span className="p-dialog-title">
      <i className={icon} />{' '}{title}
    </span>
  );

  const footer = (
    <>
      <Button label="Cancelar" icon="pi pi-times" className="btn-cancelar" onClick={onHide} />
      <Button label={confirmLabel} icon={confirmIcon} severity={confirmSeverity} onClick={onConfirm} style={{ gap: '0.5rem' }} />
    </>
  );

  return (
    <Dialog visible={visible} onHide={onHide} header={header} footer={footer} style={{ width: '400px' }} className={className} modal draggable={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
        <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: '#dc2626' }} />
        <span style={{ fontSize: '0.95rem', color: '#374151' }}>{message}</span>
      </div>
    </Dialog>
  );
}

export default ConfirmDialog;
