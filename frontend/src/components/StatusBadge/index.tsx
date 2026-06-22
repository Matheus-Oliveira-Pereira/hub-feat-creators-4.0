import './styles.scss';

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const cls = status === 'ATIVO' ? 'status-ativo' : 'status-inativo';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

export default StatusBadge;
