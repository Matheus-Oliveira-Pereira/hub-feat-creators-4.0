import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import './styles.scss';

interface DeleteDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  loading?: boolean;
  entityName?: string;
}

function DeleteDialog({ visible, onHide, onConfirm, loading, entityName }: DeleteDialogProps) {
  const [ciente, setCiente] = useState(false);

  useEffect(() => {
    if (!visible) setCiente(false);
  }, [visible]);

  const header = (
    <span className="p-dialog-title">
      <i className="pi pi-exclamation-triangle" />{' '}Exclusão Permanente
    </span>
  );

  const footer = (
    <>
      <Button label="Cancelar" icon="pi pi-times" className="btn-cancelar" onClick={onHide} disabled={loading} />
      <Button label="Excluir Permanentemente" icon="pi pi-trash" severity="danger" onClick={onConfirm} disabled={!ciente || loading} loading={loading} style={{ gap: '0.5rem' }} />
    </>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      footer={footer}
      style={{ width: '480px' }}
      className="delete-dialog"
      modal
      draggable={false}
    >
      <div className="delete-warning">
        <div className="delete-icon">
          <i className="pi pi-trash" />
        </div>
        <div className="delete-text">
          <p className="delete-message">
            {entityName
              ? <>Tem certeza que deseja excluir <strong>"{entityName}"</strong> permanentemente?</>
              : 'Tem certeza que deseja excluir este registro permanentemente?'
            }
          </p>
          <p className="delete-detail">Esta ação não pode ser desfeita. Todos os dados relacionados serão perdidos.</p>
        </div>
      </div>
      <div className="delete-checkbox">
        <Checkbox inputId="ciente" checked={ciente} onChange={(e) => setCiente(e.checked ?? false)} />
        <label htmlFor="ciente">Estou ciente que esta exclusão é permanente e irreversível</label>
      </div>
    </Dialog>
  );
}

export default DeleteDialog;
