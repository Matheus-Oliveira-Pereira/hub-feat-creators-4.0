import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { menuItems } from '../Sidebar';
import NotificationBell from '../NotificationBell';
import './styles.scss';

interface TopbarProps {
  onEditProfile: () => void;
  onLogout: () => void;
}

function getInitials(name: string | undefined): string {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function Topbar({ onEditProfile, onLogout }: TopbarProps) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const pageTitle = menuItems.find((item) => item.path && item.path === location.pathname)?.label || 'Dashboard';

  return (
    <header className="layout-topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span>{pageTitle}</span>
        </div>
      </div>

      <div className="topbar-right">
        <button type="button" className="topbar-icon-btn" onClick={toggleTheme} aria-label="Alternar tema">
          <i className={isDark ? 'pi pi-sun' : 'pi pi-moon'} />
        </button>
        <NotificationBell />

        <button type="button" className="topbar-user" onClick={onEditProfile} title="Editar meu perfil">
          <div className="user-avatar">{getInitials(user?.nome)}</div>
          <div className="user-info">
            <div className="user-name">{user?.nome || 'Usuário'}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <i className="pi pi-pencil edit-icon" />
        </button>

        <div className="topbar-divider" />

        <button type="button" className="topbar-logout" onClick={onLogout} title="Sair do sistema">
          <i className="pi pi-sign-out" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
