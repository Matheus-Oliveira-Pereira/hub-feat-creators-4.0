import { useState, useRef, useEffect } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Badge } from 'primereact/badge';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import type { Notificacao } from '../../contexts/WebSocketContext';
import './styles.scss';

const TIPO_CONFIG: Record<string, { icon: string; color: string }> = {
  CRIACAO: { icon: 'pi pi-plus-circle', color: '#22c55e' },
  ALTERACAO: { icon: 'pi pi-pencil', color: '#3b82f6' },
  EXCLUSAO: { icon: 'pi pi-trash', color: '#ef4444' },
};

function NotificationBell() {
  const { subscribe } = useNotificacoes();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    const unsub = subscribe((n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });
    return unsub;
  }, [subscribe]);

  const handleOpen = (e: React.MouseEvent) => {
    op.current?.toggle(e);
    setUnreadCount(0);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <button type="button" className="notification-bell topbar-icon-btn" onClick={handleOpen}>
        <i className="pi pi-bell" />
        {unreadCount > 0 && <Badge value={unreadCount > 9 ? '9+' : unreadCount.toString()} severity="danger" className="notification-badge" />}
      </button>

      <OverlayPanel ref={op} className="notification-panel">
        <div className="notification-header">
          <span>Notificacoes</span>
          {notifications.length > 0 && (
            <button type="button" className="clear-btn" onClick={() => setNotifications([])}>Limpar</button>
          )}
        </div>
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">Nenhuma notificacao</div>
          ) : (
            notifications.map((n, i) => {
              const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.ALTERACAO;
              return (
                <div key={`${n.timestamp}-${i}`} className="notification-item">
                  <div className="notification-icon" style={{ color: config.color }}>
                    <i className={config.icon} />
                  </div>
                  <div className="notification-content">
                    <span className="notification-message">{n.mensagem}</span>
                    <span className="notification-meta">
                      {n.usuario} &middot; {formatTime(n.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </OverlayPanel>
    </>
  );
}

export default NotificationBell;
