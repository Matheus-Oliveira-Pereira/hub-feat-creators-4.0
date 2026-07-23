import { useDraggable } from '@dnd-kit/core';
import { TarefaDTO, PRIORIDADE_LABEL, RECORRENCIA_LABEL, estaAtrasada, formatarData, responsavelNome } from '../../service';

interface Props {
  tarefa: TarefaDTO;
  onEdit: (t: TarefaDTO) => void;
  onEmail: (t: TarefaDTO) => void;
  onHistorico: (t: TarefaDTO) => void;
  overlay?: boolean;
}

function KanbanCard({ tarefa, onEdit, onEmail, onHistorico, overlay }: Readonly<Props>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarefa.id });
  const atrasada = estaAtrasada(tarefa);

  const style: React.CSSProperties = overlay
    ? {}
    : {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`kanban-card ${overlay ? 'overlay' : ''} ${atrasada ? 'tarefa-atrasada' : ''} prioridade-${tarefa.prioridade.toLowerCase()}`}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
    >
      <div className="kanban-card-head">
        <span className="kanban-card-titulo">{tarefa.titulo}</span>
        <span className={`prioridade-badge prio-${tarefa.prioridade.toLowerCase()}`}>
          {PRIORIDADE_LABEL[tarefa.prioridade]}
        </span>
      </div>

      <div className="kanban-card-sub">
        <span className="kanban-card-responsavel"><i className="pi pi-user" /> {responsavelNome(tarefa)}</span>
        {tarefa.marcaNome && <span className="kanban-card-marca"><i className="pi pi-bookmark" /> {tarefa.marcaNome}</span>}
        {tarefa.influenciadorNome && <span className="kanban-card-influ"><i className="pi pi-star" /> {tarefa.influenciadorNome}</span>}
      </div>

      <div className="kanban-card-meta">
        {tarefa.previsaoTermino && (
          <span className={`meta-chip ${atrasada ? 'alerta' : ''}`} title="Previsão de término">
            <i className="pi pi-calendar" /> {formatarData(tarefa.previsaoTermino)}
          </span>
        )}
        {tarefa.totalChecklist > 0 && (
          <span className="meta-chip" title="Checklist">
            <i className="pi pi-check-square" /> {tarefa.checklistConcluidos}/{tarefa.totalChecklist}
          </span>
        )}
        {tarefa.notificacaoAutomatica && (
          <span className="meta-chip" title="Notificações automáticas ativas">
            <i className="pi pi-bell" />
          </span>
        )}
        {tarefa.recorrencia && (
          <span className="meta-chip" title={`Recorrente — ${RECORRENCIA_LABEL[tarefa.recorrencia]}`}>
            <i className="pi pi-replay" />
          </span>
        )}
      </div>

      <div className="kanban-card-actions">
        <button type="button" onClick={() => onEdit(tarefa)} title="Editar"><i className="pi pi-pencil" /></button>
        <button type="button" onClick={() => onEmail(tarefa)} title="Enviar e-mail ao responsável"><i className="pi pi-send" /></button>
        <button type="button" onClick={() => onHistorico(tarefa)} title="Histórico"><i className="pi pi-history" /></button>
      </div>
    </div>
  );
}

export default KanbanCard;
