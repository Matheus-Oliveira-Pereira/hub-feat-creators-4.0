import { Dropdown, DropdownProps, DropdownChangeEvent } from 'primereact/dropdown';

interface StatusOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: 'Ativo', value: 'ATIVO', icon: 'pi pi-check-circle', color: '#22c55e' },
  { label: 'Inativo', value: 'INATIVO', icon: 'pi pi-ban', color: '#ef4444' },
];

function statusItemTemplate(option: StatusOption) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <i className={option.icon} style={{ color: option.color, fontSize: '0.9rem' }} />
      <span>{option.label}</span>
    </div>
  );
}

function statusValueTemplate(option: StatusOption | null) {
  if (!option) return <span>Selecione</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <i className={option.icon} style={{ color: option.color, fontSize: '0.9rem' }} />
      <span>{option.label}</span>
    </div>
  );
}

interface StatusDropdownProps extends Omit<DropdownProps, 'options' | 'itemTemplate' | 'valueTemplate'> {
  value: string | null;
  onChange: (e: DropdownChangeEvent) => void;
}

function StatusDropdown({ value, onChange, ...props }: StatusDropdownProps) {
  return (
    <Dropdown
      value={value}
      options={STATUS_OPTIONS}
      onChange={onChange}
      itemTemplate={statusItemTemplate}
      valueTemplate={statusValueTemplate}
      {...props}
    />
  );
}

export { STATUS_OPTIONS };
export default StatusDropdown;
