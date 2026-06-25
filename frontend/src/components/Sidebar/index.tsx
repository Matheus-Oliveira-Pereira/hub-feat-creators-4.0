import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canBrowse, getModulePrefixByPath } from '../../utils/roles';
import logo from '../../assets/logo.svg';
import './styles.scss';

interface MenuItem {
  label?: string;
  icon?: string;
  path?: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-th-large', path: '/' },
  { section: 'Cadastros' },
  { label: 'Usuários', icon: 'pi pi-users', path: '/usuarios' },
  { label: 'Perfis', icon: 'pi pi-shield', path: '/perfis' },
  { label: 'Influenciadores', icon: 'pi pi-star', path: '/influenciadores' },
  { label: 'Marcas', icon: 'pi pi-bookmark', path: '/marcas' },
  { label: 'Mídia Kits', icon: 'pi pi-id-card', path: '/midia-kits' },
  { section: 'Sistema' },
  { label: 'Configurações', icon: 'pi pi-cog', path: '/configuracoes' },
];

function Sidebar() {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];

  const visibleItems = menuItems.filter((item) => {
    if (item.section || item.path === '/') return true;
    if (!item.path) return true;
    const prefix = getModulePrefixByPath(item.path);
    if (!prefix) return true;
    return canBrowse(userRoles, prefix);
  });

  const filteredItems = visibleItems.filter((item, index) => {
    if (!item.section) return true;
    const next = visibleItems[index + 1];
    return next && !next.section;
  });

  return (
    <aside className="layout-sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Feat Creators" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-menu">
        {filteredItems.map((item) =>
          item.section ? (
            <div key={`section-${item.section}`} className="menu-section">
              <div className="section-dot" />
              <span className="menu-section-label">{item.section}</span>
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path === '/'}
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <i className={item.icon} />
              <span className="menu-label">{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-text">&copy; 2026 Hub Feat Creators</span>
      </div>
    </aside>
  );
}

export { menuItems };
export type { MenuItem };
export default Sidebar;
