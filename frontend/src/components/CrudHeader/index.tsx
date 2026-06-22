import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import './styles.scss';

interface CrudHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onFilterClick: () => void;
  newLabel?: string;
  onNewClick?: () => void;
  showNew?: boolean;
  showInactive?: boolean;
  onToggleInactive?: (value: boolean) => void;
  inactiveActive?: boolean;
}

function CrudHeader({
  searchValue, onSearchChange, searchPlaceholder = 'Buscar...',
  onFilterClick, newLabel, onNewClick, showNew = true,
  showInactive = false, onToggleInactive, inactiveActive = false,
}: CrudHeaderProps) {
  return (
    <div className="table-header">
      <div className="search-wrapper">
        <i className="pi pi-search" />
        <InputText value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} />
      </div>
      {showInactive && onToggleInactive && (
        <>
          <Tooltip target=".btn-toggle-inativos" position="bottom" />
          <button
            type="button"
            className={`btn-toggle-inativos ${inactiveActive ? 'active' : ''}`}
            onClick={() => onToggleInactive(!inactiveActive)}
            data-pr-tooltip={inactiveActive ? 'Ocultar inativos' : 'Ver inativos'}
          >
            <i className={inactiveActive ? 'pi pi-eye' : 'pi pi-eye-slash'} />
          </button>
        </>
      )}
      <Button icon="pi pi-filter" label="Filtros" className="btn-filtros" onClick={onFilterClick} />
      {showNew && newLabel && onNewClick && (
        <Button label={newLabel} icon="pi pi-plus" className="btn-novo" onClick={onNewClick} />
      )}
    </div>
  );
}

export default CrudHeader;
