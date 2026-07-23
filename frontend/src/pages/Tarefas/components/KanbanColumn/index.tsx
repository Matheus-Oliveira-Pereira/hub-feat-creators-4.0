import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StatusTarefa, STATUS_TAREFA_LABEL } from '../../service';

interface Props {
  status: StatusTarefa;
  quantidade: number;
  children: ReactNode;
}

function KanbanColumn({ status, quantidade, children }: Readonly<Props>) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'over' : ''} col-${status.toLowerCase()}`}>
      <div className="kanban-column-head">
        <span className="kanban-column-title">{STATUS_TAREFA_LABEL[status]}</span>
        <span className="kanban-column-count">{quantidade}</span>
      </div>
      <div className="kanban-column-body">{children}</div>
    </div>
  );
}

export default KanbanColumn;
