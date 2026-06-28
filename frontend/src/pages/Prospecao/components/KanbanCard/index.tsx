import { useDraggable } from '@dnd-kit/core';
import { Prospecao, TIPO_LABEL, STATUS_PERMITE_FOLLOWUP } from '../../service';

interface Props {
  prospecao: Prospecao;
  onEdit: (p: Prospecao) => void;
  onFollowUp: (p: Prospecao) => void;
}

function formatarValor(v: number | null): string {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diasParado(iso?: string): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function KanbanCard({ prospecao, onEdit, onFollowUp }: Readonly<Props>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: prospecao.id });
  const dias = diasParado(prospecao.ultimaModificacao);
  const ultimoFollowUp = prospecao.followUps?.[0]?.data;
  const podeFollowUp = STATUS_PERMITE_FOLLOWUP.includes(prospecao.status);

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="kanban-card" {...attributes} {...listeners}>
      <div className="kanban-card-head">
        <span className="kanban-card-marca">{prospecao.marca?.nome ?? '—'}</span>
        {prospecao.tipo && (
          <span className={`tipo-badge tipo-${prospecao.tipo.toLowerCase()}`}>{TIPO_LABEL[prospecao.tipo]}</span>
        )}
      </div>

      <div className="kanban-card-valor">{formatarValor(prospecao.valorAceito ?? prospecao.valorProposto)}</div>

      <div className="kanban-card-meta">
        {dias != null && (
          <span className={`dias-parado ${dias >= 7 ? 'alerta' : ''}`} title="Dias desde a última atualização">
            <i className="pi pi-clock" /> {dias}d
          </span>
        )}
        {ultimoFollowUp && (
          <span className="ultimo-followup" title="Último follow-up">
            <i className="pi pi-send" /> {new Date(ultimoFollowUp).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      <div className="kanban-card-actions">
        <button type="button" onClick={() => onEdit(prospecao)} title="Editar"><i className="pi pi-pencil" /></button>
        {podeFollowUp && (
          <button type="button" onClick={() => onFollowUp(prospecao)} title="Follow-up"><i className="pi pi-send" /></button>
        )}
      </div>
    </div>
  );
}

export default KanbanCard;
