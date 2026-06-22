import { Tooltip } from 'primereact/tooltip';
import './styles.scss';

interface TableActionsProps {
  onEdit?: () => void;
  onDeactivate?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onHistory?: () => void;
  showEdit?: boolean;
  showDeactivate?: boolean;
  showRestore?: boolean;
  showDelete?: boolean;
  showHistory?: boolean;
}

function TableActions({
  onEdit, onDeactivate, onRestore, onDelete, onHistory,
  showEdit = true, showDeactivate = true, showRestore = false, showDelete = false, showHistory = false,
}: TableActionsProps) {
  const hasAny = showHistory || showEdit || showDeactivate || showRestore || showDelete;
  if (!hasAny) return null;

  return (
    <div className="table-actions">
      <Tooltip target=".table-actions button" position="top" />
      {showHistory && onHistory && (
        <button type="button" className="action-btn btn-historico" onClick={onHistory} data-pr-tooltip="Histórico">
          <i className="pi pi-history" />
        </button>
      )}
      {showEdit && onEdit && (
        <button type="button" className="action-btn btn-editar" onClick={onEdit} data-pr-tooltip="Editar">
          <i className="pi pi-pencil" />
        </button>
      )}
      {showDeactivate && onDeactivate && (
        <button type="button" className="action-btn btn-desativar" onClick={onDeactivate} data-pr-tooltip="Desativar">
          <i className="pi pi-ban" />
        </button>
      )}
      {showRestore && onRestore && (
        <button type="button" className="action-btn btn-restaurar" onClick={onRestore} data-pr-tooltip="Restaurar">
          <i className="pi pi-replay" />
        </button>
      )}
      {showDelete && onDelete && (
        <button type="button" className="action-btn btn-excluir" onClick={onDelete} data-pr-tooltip="Excluir permanentemente">
          <i className="pi pi-trash" />
        </button>
      )}
    </div>
  );
}

export default TableActions;
