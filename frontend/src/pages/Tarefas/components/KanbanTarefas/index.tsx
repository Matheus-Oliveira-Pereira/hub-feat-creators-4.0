import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import KanbanColumn from '../KanbanColumn';
import KanbanCard from '../KanbanCard';
import { tarefaService, TarefaDTO, TarefaFiltros, StatusTarefa, KANBAN_ORDEM } from '../../service';

interface Props {
  filtros: TarefaFiltros;
  podeEditar: boolean;
  onEdit: (t: TarefaDTO) => void;
  onEmail: (t: TarefaDTO) => void;
  onHistorico: (t: TarefaDTO) => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
}

function KanbanTarefas({ filtros, podeEditar, onEdit, onEmail, onHistorico, onToast }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cancelarAlvo, setCancelarAlvo] = useState<TarefaDTO | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Coluna de canceladas só aparece quando o filtro de status a inclui.
  const mostrarCanceladas = !!filtros.status?.includes('CANCELADA');
  const colunas: StatusTarefa[] = mostrarCanceladas ? [...KANBAN_ORDEM, 'CANCELADA'] : KANBAN_ORDEM;

  const boardFiltros: TarefaFiltros = {
    ...filtros,
    status: filtros.status?.length ? filtros.status : [...KANBAN_ORDEM],
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tarefas', 'board', boardFiltros],
    queryFn: () => tarefaService.listar(0, 1000, boardFiltros),
  });
  const board = data?.content ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tarefas'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusTarefa }) => tarefaService.alterarStatus(id, status),
    onSuccess: () => invalidate(),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao mover tarefa');
      invalidate();
    },
  });

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const novoStatus = over.id as StatusTarefa;
    const card = board.find((t) => t.id === active.id);
    if (!card || card.status === novoStatus) return;

    if (novoStatus === 'CANCELADA') {
      setCancelarAlvo(card);
      return;
    }
    statusMutation.mutate({ id: card.id, status: novoStatus });
  };

  const porStatus = (status: StatusTarefa) => board.filter((t) => t.status === status);
  const cardAtivo = activeId ? board.find((t) => t.id === activeId) ?? null : null;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={podeEditar ? handleDragEnd : undefined}>
        <div className="kanban-board">
          {colunas.map((status) => (
            <KanbanColumn key={status} status={status} quantidade={porStatus(status).length}>
              {porStatus(status).map((t) => (
                <KanbanCard key={t.id} tarefa={t} onEdit={onEdit} onEmail={onEmail} onHistorico={onHistorico} />
              ))}
            </KanbanColumn>
          ))}
        </div>
        <DragOverlay>
          {cardAtivo ? <KanbanCard tarefa={cardAtivo} onEdit={() => {}} onEmail={() => {}} onHistorico={() => {}} overlay /> : null}
        </DragOverlay>
        {isLoading && <p className="tarefas-loading">Carregando...</p>}
      </DndContext>

      <ConfirmDialog
        visible={!!cancelarAlvo}
        onHide={() => setCancelarAlvo(null)}
        onConfirm={() => {
          if (cancelarAlvo) statusMutation.mutate({ id: cancelarAlvo.id, status: 'CANCELADA' });
          setCancelarAlvo(null);
        }}
        title="Cancelar Tarefa"
        icon="pi pi-times-circle"
        message={`Cancelar a tarefa "${cancelarAlvo?.titulo}"?`}
        confirmLabel="Cancelar tarefa"
        confirmIcon="pi pi-times-circle"
        confirmSeverity="warning"
      />
    </>
  );
}

export default KanbanTarefas;
