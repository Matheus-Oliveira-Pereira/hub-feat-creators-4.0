import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Toast } from 'primereact/toast';
import { SelectButton } from 'primereact/selectbutton';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import PageHeader from '../../components/PageHeader';
import CrudHeader from '../../components/CrudHeader';
import HistoryDialog from '../../components/HistoryDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeleteDialog from '../../components/DeleteDialog';
import FilterSidebar from '../../components/FilterSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import ListaTarefas from './components/ListaTarefas';
import KanbanTarefas from './components/KanbanTarefas';
import AgendaTarefas from './components/AgendaTarefas';
import TarefaDialog from './components/TarefaDialog';
import EnvioEmailTarefaDialog from './components/EnvioEmailTarefaDialog';
import {
  tarefaService,
  Tarefa,
  TarefaDTO,
  TarefaFiltros,
  StatusTarefa,
  PrioridadeTarefa,
  STATUS_TAREFA_LABEL,
  PRIORIDADE_LABEL,
} from './service';
import './styles.scss';

type ViewMode = 'lista' | 'kanban' | 'agenda';

const VIEW_OPTIONS = [
  { value: 'lista', icon: 'pi pi-list', title: 'Listagem' },
  { value: 'kanban', icon: 'pi pi-th-large', title: 'Kanban' },
  { value: 'agenda', icon: 'pi pi-calendar', title: 'Agenda' },
];

const STATUS_OPTIONS = (Object.keys(STATUS_TAREFA_LABEL) as StatusTarefa[])
  .map((s) => ({ label: STATUS_TAREFA_LABEL[s], value: s }));
const PRIORIDADE_OPTIONS = (Object.keys(PRIORIDADE_LABEL) as PrioridadeTarefa[])
  .map((p) => ({ label: PRIORIDADE_LABEL[p], value: p }));

function Tarefas() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.TAREFAS.prefix);
  const podeEditar = canChange(roles, MODULES.TAREFAS.prefix);
  const podeExcluir = canDelete(roles, MODULES.TAREFAS.prefix);

  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('tarefas:viewMode') as ViewMode) || 'lista');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [emailAlvo, setEmailAlvo] = useState<TarefaDTO | null>(null);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<TarefaFiltros>({ status: [], prioridade: [] });
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TarefaDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TarefaDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: TarefaFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tarefas'] });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => tarefaService.desativar(id),
    onSuccess: () => { showToast('success', 'Tarefa desativada'); setDeactivateTarget(null); invalidate(); },
    onError: () => showToast('error', 'Erro ao desativar'),
  });
  const restaurarMutation = useMutation({
    mutationFn: (id: string) => tarefaService.restaurar(id),
    onSuccess: () => { showToast('success', 'Tarefa restaurada'); invalidate(); },
    onError: () => showToast('error', 'Erro ao restaurar'),
  });
  const excluirMutation = useMutation({
    mutationFn: (id: string) => tarefaService.excluir(id),
    onSuccess: () => { showToast('success', 'Tarefa excluída'); setDeleteTarget(null); invalidate(); },
    onError: () => showToast('error', 'Erro ao excluir'),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedBusca(filtroGlobal), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Tarefa') invalidate(); });
    return unsub;
  }, [subscribe]);

  const trocarView = (v: ViewMode) => {
    setViewMode(v);
    localStorage.setItem('tarefas:viewMode', v);
  };

  const showToast = (severity: 'success' | 'error' | 'warn', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : 'Atenção', detail });

  const abrirNovo = () => { setEditando(null); setDialogVisible(true); };
  const abrirEdicao = async (row: TarefaDTO) => {
    try {
      const full = await tarefaService.buscar(row.id);
      setEditando(full);
      setDialogVisible(true);
    } catch {
      showToast('error', 'Erro ao carregar tarefa');
    }
  };

  const abrirHistorico = (row: TarefaDTO) => { setHistoryId(row.id); setHistoryVisible(true); };

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.prioridade?.length || !!filtros.marca || !!filtros.atrasadas;

  const crudHeader = (
    <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal}
      searchPlaceholder="Buscar por título, responsável, influenciador ou marca..."
      onFilterClick={() => setFilterVisible(true)} newLabel="Nova Tarefa" onNewClick={abrirNovo} showNew={podeAdicionar}
      showInactive onToggleInactive={setMostrarInativos} inactiveActive={mostrarInativos}
    />
  );

  return (
    <div className="crud-page tarefas-page">
      <Toast ref={toast} />
      <div className="tarefas-header">
        <PageHeader title="Tarefas" subtitle={mostrarInativos ? 'Registros desativados' : 'Gestão de tarefas da assessoria'} />
        <SelectButton
          value={viewMode}
          options={VIEW_OPTIONS}
          onChange={(e) => { if (e.value) trocarView(e.value); }}
          allowEmpty={false}
          itemTemplate={(opt) => <i className={opt.icon} title={opt.title} />}
          className="tarefas-view-toggle"
        />
      </div>

      {viewMode === 'lista' && (
        <div className="content-card">
          <ListaTarefas
            filtros={queryFiltros}
            mostrarInativos={mostrarInativos}
            podeEditar={podeEditar}
            podeExcluir={podeExcluir}
            header={crudHeader}
            onEdit={abrirEdicao}
            onEmail={setEmailAlvo}
            onHistory={abrirHistorico}
            onDeactivate={setDeactivateTarget}
            onRestore={(t) => restaurarMutation.mutate(t.id)}
            onDelete={setDeleteTarget}
          />
        </div>
      )}

      {viewMode === 'kanban' && (
        <>
          <div className="tarefas-toolbar">{crudHeader}</div>
          <KanbanTarefas
            filtros={queryFiltros}
            podeEditar={podeEditar}
            onEdit={abrirEdicao}
            onEmail={setEmailAlvo}
            onHistorico={abrirHistorico}
            onToast={showToast}
          />
        </>
      )}

      {viewMode === 'agenda' && (
        <>
          <div className="tarefas-toolbar">{crudHeader}</div>
          <AgendaTarefas filtros={queryFiltros} onEdit={abrirEdicao} />
        </>
      )}

      <TarefaDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        onSaved={invalidate}
        onToast={showToast}
        editando={editando}
        inicial={null}
      />

      <EnvioEmailTarefaDialog
        visible={!!emailAlvo}
        onHide={() => setEmailAlvo(null)}
        onToast={showToast}
        tarefa={emailAlvo}
      />

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Tarefa" icon="pi pi-ban" message={`Deseja desativar a tarefa "${deactivateTarget?.titulo}"?`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.titulo} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/tarefas" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)}
        onClear={() => setFiltros({ status: [], prioridade: [] })} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-status">Status</label>
          <MultiSelect id="filter-status" value={filtros.status} options={STATUS_OPTIONS}
            onChange={(e) => setFiltros({ ...filtros, status: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-prioridade">Prioridade</label>
          <MultiSelect id="filter-prioridade" value={filtros.prioridade} options={PRIORIDADE_OPTIONS}
            onChange={(e) => setFiltros({ ...filtros, prioridade: e.value })} placeholder="Todas" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-marca">Marca</label>
          <InputText id="filter-marca" value={filtros.marca ?? ''}
            onChange={(e) => setFiltros({ ...filtros, marca: e.target.value || undefined })} placeholder="Filtrar por marca" className="w-full" />
        </div>
        <div className="form-field filtro-checkbox">
          <Checkbox inputId="filter-atrasadas" checked={!!filtros.atrasadas}
            onChange={(e) => setFiltros({ ...filtros, atrasadas: e.checked || undefined })} />
          <label htmlFor="filter-atrasadas">Somente atrasadas</label>
        </div>
      </FilterSidebar>
    </div>
  );
}

export default Tarefas;
