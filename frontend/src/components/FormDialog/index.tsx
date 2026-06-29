import { ReactNode } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import './styles.scss';

interface FormDialogProps {
  visible: boolean;
  onHide: () => void;
  title: string;
  icon: string;
  onSave: () => void;
  width?: string;
  className?: string;
  children: ReactNode;
  loading?: boolean;
  saveLabel?: string;
  saveIcon?: string;
}

function FormDialog({ visible, onHide, title, icon, onSave, width = '500px', className, children, loading, saveLabel = 'Salvar', saveIcon = 'pi pi-check' }: FormDialogProps) {
  const header = (
    <span className="p-dialog-title">
      <i className={icon} />{' '}{title}
    </span>
  );

  const footer = (
    <>
      <Button label="Cancelar" icon="pi pi-times" className="btn-cancelar" onClick={onHide} disabled={loading} />
      <Button label={saveLabel} icon={saveIcon} className="btn-salvar" onClick={onSave} loading={loading} disabled={loading} />
    </>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      footer={footer}
      style={{ width }}
      className={className}
      modal
      draggable={false}
    >
      {children}
    </Dialog>
  );
}

export default FormDialog;
