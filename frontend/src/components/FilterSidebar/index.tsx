import { ReactNode } from 'react';
import { Button } from 'primereact/button';
import './styles.scss';

interface FilterSidebarProps {
  visible: boolean;
  onHide: () => void;
  onClear: () => void;
  onApply?: () => void;
  clearDisabled: boolean;
  children: ReactNode;
}

function FilterSidebar({ visible, onHide, onClear, onApply, clearDisabled, children }: FilterSidebarProps) {
  return (
    <>
      <div className={`filter-sidebar-overlay ${visible ? 'visible' : ''}`} onClick={onHide} />
      <div className={`filter-sidebar ${visible ? 'visible' : ''}`}>
        <div className="filter-header">
          <div className="filter-title">
            <i className="pi pi-filter" />
            <span>Filtros Avançados</span>
          </div>
          <Button icon="pi pi-times" rounded text style={{ color: 'white' }} onClick={onHide} />
        </div>
        <div className="filter-body">
          {children}
        </div>
        <div className="filter-footer">
          <Button label="Limpar" icon="pi pi-filter-slash" className="btn-cancelar" onClick={onClear} disabled={clearDisabled} />
          <Button label="Aplicar" icon="pi pi-check" className="btn-salvar" onClick={onApply || onHide} />
        </div>
      </div>
    </>
  );
}

export default FilterSidebar;
