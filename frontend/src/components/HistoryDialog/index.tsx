import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import BaseService from '../../services/baseService';
import './styles.scss';

interface AuditoriaItem {
  revisao: number;
  data: string;
  usuario: string;
  tipoOperacao: string;
  dados: Record<string, string>;
}

interface HistoryDialogProps {
  visible: boolean;
  onHide: () => void;
  entityId: string | null;
  servicePath: string;
  title?: string;
}

const OPERATION_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  'CRIAÇÃO': { color: '#166534', bg: '#dcfce7', border: '#bbf7d0', icon: 'pi pi-plus-circle', label: 'Criação' },
  'ALTERAÇÃO': { color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', icon: 'pi pi-sync', label: 'Alteração' },
  'EXCLUSÃO': { color: '#991b1b', bg: '#fee2e2', border: '#fecaca', icon: 'pi pi-times-circle', label: 'Exclusão' },
};

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  nome: 'Nome',
  email: 'E-mail',
  status: 'Status',
  descricao: 'Descrição',
  criadoPor: 'Criado por',
  modificadoPor: 'Modificado por',
  registro: 'Data de criação',
  ultimaModificacao: 'Última modificação',
};

function HistoryDialog({ visible, onHide, entityId, servicePath, title = 'Histórico de Alterações' }: HistoryDialogProps) {
  const [historico, setHistorico] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && entityId) {
      setLoading(true);
      const service = new BaseService(servicePath);
      service.getHistorico(entityId)
        .then((data) => setHistorico(data as AuditoriaItem[]))
        .catch(() => setHistorico([]))
        .finally(() => setLoading(false));
    } else {
      setHistorico([]);
    }
  }, [visible, entityId, servicePath]);

  const header = (
    <span className="p-dialog-title">
      <i className="pi pi-history" />{' '}{title}
    </span>
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const customContent = (item: AuditoriaItem) => {
    const config = OPERATION_CONFIG[item.tipoOperacao] || OPERATION_CONFIG['ALTERAÇÃO'];

    return (
      <div className="history-item">
        <div className="history-header">
          <span className="history-tag" style={{ color: config.color, background: config.bg, borderColor: config.border }}>
            <i className={config.icon} />
            {config.label}
          </span>
          <span className="history-date">{formatDate(item.data)}</span>
        </div>
        <div className="history-user">
          <i className="pi pi-user" />
          <span>{item.usuario || 'sistema'}</span>
        </div>
        {item.dados && Object.keys(item.dados).length > 0 && (
          <div className="history-data">
            {Object.entries(item.dados).map(([key, value]) => (
              <div key={key} className="history-field">
                <span className="field-name">{FIELD_LABELS[key] || key}</span>
                <span className="field-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MARKER_COLORS: Record<string, string> = {
    'CRIAÇÃO': '#22c55e',
    'ALTERAÇÃO': '#3b82f6',
    'EXCLUSÃO': '#ef4444',
  };

  const marker = (item: AuditoriaItem) => {
    const config = OPERATION_CONFIG[item.tipoOperacao] || OPERATION_CONFIG['ALTERAÇÃO'];
    return (
      <span className="history-marker" style={{ background: MARKER_COLORS[item.tipoOperacao] || '#3b82f6' }}>
        <i className={config.icon} />
      </span>
    );
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      style={{ width: '600px', maxHeight: '80vh' }}
      modal
      draggable={false}
    >
      {loading ? (
        <div className="flex justify-content-center p-4">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#A6C400' }} />
        </div>
      ) : historico.length === 0 ? (
        <div className="text-center p-4" style={{ color: '#94a3b8' }}>
          Nenhum histórico encontrado.
        </div>
      ) : (
        <Timeline
          value={historico}
          content={customContent}
          marker={marker}
          className="history-timeline"
        />
      )}
    </Dialog>
  );
}

export default HistoryDialog;
