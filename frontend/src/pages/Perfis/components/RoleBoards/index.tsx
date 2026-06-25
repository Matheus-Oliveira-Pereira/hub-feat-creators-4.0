import { InputSwitch } from 'primereact/inputswitch';
import './styles.scss';

interface Role {
  value: string;
  label: string;
}

interface RoleBoard {
  module: string;
  icon: string;
  color: string;
  roles: Role[];
}

interface RoleBoardsProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

const ROLE_BOARDS: RoleBoard[] = [
  {
    module: 'Usuários',
    icon: 'pi pi-users',
    color: '#C2E000',
    roles: [
      { value: 'USRA', label: 'Adicionar' },
      { value: 'USRB', label: 'Visualizar' },
      { value: 'USRC', label: 'Alterar' },
      { value: 'USRD', label: 'Excluir' },
    ],
  },
  {
    module: 'Perfis',
    icon: 'pi pi-shield',
    color: '#8b5cf6',
    roles: [
      { value: 'PRFA', label: 'Adicionar' },
      { value: 'PRFB', label: 'Visualizar' },
      { value: 'PRFC', label: 'Alterar' },
      { value: 'PRFD', label: 'Excluir' },
    ],
  },
  {
    module: 'Influenciadores',
    icon: 'pi pi-star',
    color: '#e1306c',
    roles: [
      { value: 'INFA', label: 'Adicionar' },
      { value: 'INFB', label: 'Visualizar' },
      { value: 'INFC', label: 'Alterar' },
      { value: 'INFD', label: 'Excluir' },
    ],
  },
  {
    module: 'Marcas',
    icon: 'pi pi-bookmark',
    color: '#f59e0b',
    roles: [
      { value: 'MRCA', label: 'Adicionar' },
      { value: 'MRCB', label: 'Visualizar' },
      { value: 'MRCC', label: 'Alterar' },
      { value: 'MRCD', label: 'Excluir' },
    ],
  },
  {
    module: 'Mídia Kits',
    icon: 'pi pi-id-card',
    color: '#0ea5e9',
    roles: [
      { value: 'MDKA', label: 'Adicionar' },
      { value: 'MDKB', label: 'Visualizar' },
      { value: 'MDKC', label: 'Alterar' },
      { value: 'MDKD', label: 'Excluir' },
    ],
  },
  {
    module: 'Configurações',
    icon: 'pi pi-cog',
    color: '#64748b',
    roles: [
      { value: 'CFGB', label: 'Visualizar' },
      { value: 'CFGC', label: 'Alterar' },
    ],
  },
];

const ALL_ROLE_VALUES = ROLE_BOARDS.flatMap((b) => b.roles.map((r) => r.value));

function RoleBoards({ selectedRoles, onChange }: RoleBoardsProps) {
  const toggleRole = (roleValue: string) => {
    const has = selectedRoles.includes(roleValue);
    onChange(has ? selectedRoles.filter((r) => r !== roleValue) : [...selectedRoles, roleValue]);
  };

  const toggleBoard = (board: RoleBoard) => {
    const boardRoles = board.roles.map((r) => r.value);
    const allActive = boardRoles.every((r) => selectedRoles.includes(r));
    onChange(allActive
      ? selectedRoles.filter((r) => !boardRoles.includes(r))
      : [...new Set([...selectedRoles, ...boardRoles])]);
  };

  const toggleAll = () => {
    const allActive = ALL_ROLE_VALUES.every((r) => selectedRoles.includes(r));
    onChange(allActive ? [] : [...ALL_ROLE_VALUES]);
  };

  const isBoardActive = (board: RoleBoard) => board.roles.every((r) => selectedRoles.includes(r.value));
  const allActive = ALL_ROLE_VALUES.every((r) => selectedRoles.includes(r));

  return (
    <div className="roles-section">
      <div className="roles-section-header">
        <label>Permissões</label>
        <div className="select-all-toggle">
          <span className={allActive ? 'toggle-label active' : 'toggle-label'}>Marcar Todas</span>
          <InputSwitch checked={allActive} onChange={toggleAll} />
        </div>
      </div>

      <div className="role-boards">
        {ROLE_BOARDS.map((board) => (
          <div key={board.module} className="role-board" style={{ '--board-color': board.color } as React.CSSProperties}>
            <div className="board-header">
              <div className="board-title">
                <i className={board.icon} />
                <span>{board.module}</span>
              </div>
              <InputSwitch checked={isBoardActive(board)} onChange={() => toggleBoard(board)} />
            </div>
            <div className="board-roles">
              {board.roles.map((role) => {
                const active = selectedRoles.includes(role.value);
                return (
                  <div key={role.value} className={`role-row ${active ? 'active' : ''}`}>
                    <div className="role-info">
                      <span className="role-code">{role.value}</span>
                      <span className="role-label">{role.label}</span>
                    </div>
                    <InputSwitch checked={active} onChange={() => toggleRole(role.value)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoleBoards;
