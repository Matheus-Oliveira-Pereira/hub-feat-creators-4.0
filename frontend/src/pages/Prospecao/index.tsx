import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { pdf } from '@react-pdf/renderer';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, MODULES } from '../../utils/roles';
import {
  prospecaoService,
  Prospecao,
  StatusProspecao,
  STATUS_ORDEM,
} from './service';
import KanbanColumn from './components/KanbanColumn';
import KanbanCard from './components/KanbanCard';
import ProspecaoDialog from './components/ProspecaoDialog';
import FollowUpDialog from './components/FollowUpDialog';
import EncerramentoDialog from './components/EncerramentoDialog';
import ProspecaoReportDocument from './components/ProspecaoReportDocument';
import PublicidadeDialog, { PublicidadeInicial } from '../Publicidade/components/PublicidadeDialog';
import './styles.scss';

/** Monta payload de atualização: escalares completos + relações reduzidas a {id}. */
function buildUpdatePayload(p: Prospecao, overrides: Partial<Prospecao>): Partial<Prospecao> {
  return {
    ...p,
    influenciador: { id: p.influenciador.id, nome: p.influenciador.nome },
    marca: { id: p.marca.id, nome: p.marca.nome },
    contatoMarca: p.contatoMarca ? ({ id: p.contatoMarca.id } as Prospecao['contatoMarca']) : null,
    followUps: [],
    ...overrides,
  };
}

function ProspecaoPage() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.PROSPECAO.prefix);
  const podeEditar = canChange(roles, MODULES.PROSPECAO.prefix);

  const [influId, setInfluId] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState<Prospecao | null>(null);
  const [followUpAlvo, setFollowUpAlvo] = useState<Prospecao | null>(null);
  const [encerrarAlvo, setEncerrarAlvo] = useState<Prospecao | null>(null);
  const [publiInicial, setPubliInicial] = useState<PublicidadeInicial | null>(null);
  const [exportando, setExportando] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: influenciadores = [] } = useQuery({
    queryKey: ['prospecao-influenciadores'],
    queryFn: prospecaoService.listarInfluenciadoresAtivos,
  });

  const { data: marcas = [] } = useQuery({
    queryKey: ['prospecao-marcas'],
    queryFn: prospecaoService.listarMarcasAtivas,
  });

  const { data: board = [], isLoading } = useQuery({
    queryKey: ['prospecao-board', influId],
    queryFn: () => prospecaoService.porInfluenciador(influId!),
    enabled: !!influId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['prospecao-board', influId] });

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Prospecao' || n.entidade === 'Publicidade') invalidate(); });
    return unsub;
  }, [subscribe, influId]);

  const statusMutation = useMutation({
    mutationFn: ({ p, status, motivo }: { p: Prospecao; status: StatusProspecao; motivo?: string }) =>
      prospecaoService.atualizar(p.id, buildUpdatePayload(p, { status, motivoEncerramento: motivo ?? p.motivoEncerramento })),
    onSuccess: () => { invalidate(); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message ?? 'Erro ao mover prospecção' });
      invalidate();
    },
  });

  const influSelecionado = influenciadores.find((i) => i.id === influId) ?? null;

  const showToast = (severity: 'success' | 'error' | 'warn', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : 'Atenção', detail });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const novoStatus = over.id as StatusProspecao;
    const card = board.find((p) => p.id === active.id);
    if (!card || card.status === novoStatus) return;

    if (novoStatus === 'ENCERRADO') {
      setEncerrarAlvo(card);
      return;
    }
    if (novoStatus === 'PUBLICIDADE_FECHADA') {
      setPubliInicial({
        prospecaoId: card.id,
        marca: { id: card.marca.id, nome: card.marca.nome },
        influenciador: { id: card.influenciador.id, nome: card.influenciador.nome },
        valorTotal: card.valorAceito ?? card.valorProposto ?? null,
      });
      return;
    }
    statusMutation.mutate({ p: card, status: novoStatus });
  };

  const abrirNovo = () => { setEditando(null); setDialogVisible(true); };
  const abrirEdicao = (p: Prospecao) => { setEditando(p); setDialogVisible(true); };

  const exportarPdf = async () => {
    if (!influSelecionado) return;
    setExportando(true);
    try {
      const blob = await pdf(<ProspecaoReportDocument influenciadorNome={influSelecionado.nome} prospecoes={board} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prospeccao-${influSelecionado.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('error', 'Falha ao gerar PDF');
    } finally {
      setExportando(false);
    }
  };

  const porStatus = (status: StatusProspecao) => board.filter((p) => p.status === status);

  return (
    <div className="prospecao-page">
      <Toast ref={toast} />
      <PageHeader title="Prospecção" subtitle="Pipeline de prospecções por influenciador" />

      <div className="prospecao-toolbar">
        <Dropdown
          value={influId}
          options={influenciadores.map((i) => ({ label: i.nome, value: i.id }))}
          onChange={(e) => setInfluId(e.value)}
          placeholder="Selecione um influenciador"
          filter
          className="prospecao-influ-select"
        />
        <div className="prospecao-toolbar-actions">
          <Button label="Relatório PDF" icon="pi pi-file-pdf" className="btn-cancelar" onClick={exportarPdf} disabled={!influId || exportando} loading={exportando} />
          {podeAdicionar && <Button label="Nova Prospecção" icon="pi pi-plus" className="btn-salvar" onClick={abrirNovo} disabled={!influId} />}
        </div>
      </div>

      {!influId && (
        <div className="prospecao-empty">
          <i className="pi pi-users" />
          <p>Selecione um influenciador para visualizar o pipeline.</p>
        </div>
      )}

      {influId && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={podeEditar ? handleDragEnd : undefined}>
          <div className="kanban-board">
            {STATUS_ORDEM.map((status) => (
              <KanbanColumn key={status} status={status} quantidade={porStatus(status).length}>
                {porStatus(status).map((p) => (
                  <KanbanCard key={p.id} prospecao={p} onEdit={abrirEdicao} onFollowUp={setFollowUpAlvo} />
                ))}
              </KanbanColumn>
            ))}
          </div>
          {isLoading && <p className="prospecao-loading">Carregando...</p>}
        </DndContext>
      )}

      <ProspecaoDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        onSaved={invalidate}
        onToast={showToast}
        influenciador={influSelecionado}
        editando={editando}
        marcas={marcas}
      />

      <FollowUpDialog
        visible={!!followUpAlvo}
        onHide={() => setFollowUpAlvo(null)}
        onSaved={invalidate}
        onToast={showToast}
        prospecao={followUpAlvo}
      />

      <EncerramentoDialog
        visible={!!encerrarAlvo}
        onHide={() => setEncerrarAlvo(null)}
        loading={statusMutation.isPending}
        onConfirm={(motivo) => {
          if (encerrarAlvo) statusMutation.mutate({ p: encerrarAlvo, status: 'ENCERRADO', motivo });
          setEncerrarAlvo(null);
        }}
      />

      <PublicidadeDialog
        visible={!!publiInicial}
        onHide={() => setPubliInicial(null)}
        onSaved={() => { setPubliInicial(null); invalidate(); }}
        onToast={showToast}
        inicial={publiInicial}
        editando={null}
      />
    </div>
  );
}

export default ProspecaoPage;
