import { useQuery } from '@tanstack/react-query';
import { Card } from 'primereact/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BaseService from '../../services/baseService';
import './styles.scss';

const influenciadorService = new BaseService('/influenciadores');
const marcaService = new BaseService('/marcas');
const midiaKitService = new BaseService('/midiakit-templates');
const usuarioService = new BaseService('/usuarios');

interface StatCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
}

function useTotal(key: string, service: BaseService) {
  return useQuery({
    queryKey: ['dashboard-total', key],
    queryFn: () => service.getPage(['page=0', 'size=1']).then((r) => r.totalElements).catch(() => 0),
    staleTime: 30 * 1000,
  });
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: influenciadores = 0 } = useTotal('influenciadores', influenciadorService);
  const { data: marcas = 0 } = useTotal('marcas', marcaService);
  const { data: midiaKits = 0 } = useTotal('midia-kits', midiaKitService);
  const { data: equipe = 0 } = useTotal('equipe', usuarioService);

  const cards: StatCard[] = [
    { title: 'Influenciadores', value: influenciadores, icon: 'pi pi-star', color: '#141414', bg: 'linear-gradient(135deg, #C2E000, #A6C400)' },
    { title: 'Marcas', value: marcas, icon: 'pi pi-bookmark', color: '#C2E000', bg: 'linear-gradient(135deg, #1d1d1d, #141414)' },
    { title: 'Mídia Kits', value: midiaKits, icon: 'pi pi-id-card', color: '#ffffff', bg: 'linear-gradient(135deg, #f59e0b, #f97316)' },
    { title: 'Equipe', value: equipe, icon: 'pi pi-users', color: '#ffffff', bg: 'linear-gradient(135deg, #22c55e, #10b981)' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Bem-vindo de volta, {user?.nome || 'Administrador'}</p>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.title} className="stat-card">
            <div className="stat-icon" style={{ background: card.bg }}>
              <i className={card.icon} style={{ color: card.color }} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.title}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="content-card">
          <div className="card-header-custom"><h3>Acesso Rápido</h3></div>
          <div className="quick-links">
            <button type="button" className="quick-link" onClick={() => navigate('/influenciadores', { state: { abrirNovo: true } })}><i className="pi pi-user-plus" /><span>Novo Influenciador</span></button>
            <button type="button" className="quick-link" onClick={() => navigate('/midia-kits')}><i className="pi pi-id-card" /><span>Gerar Mídia Kit</span></button>
            <button type="button" className="quick-link" onClick={() => navigate('/marcas')}><i className="pi pi-bookmark" /><span>Gerenciar Marcas</span></button>
          </div>
        </Card>

        <Card className="content-card">
          <div className="card-header-custom"><h3>Recursos da Assessoria</h3></div>
          <div className="system-info">
            <div className="info-row"><span className="info-label">Mídia Kits</span><span className="info-value">Gerados em PDF</span></div>
            <div className="info-row"><span className="info-label">Insights</span><span className="info-value">Análise com IA</span></div>
            <div className="info-row"><span className="info-label">Influenciadores</span><span className="info-value">Importação via CSV</span></div>
            <div className="info-row"><span className="info-label">Marcas</span><span className="info-value">Contatos por marca</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
