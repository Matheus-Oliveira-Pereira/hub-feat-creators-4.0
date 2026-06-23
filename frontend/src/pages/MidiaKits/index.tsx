import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/PageHeader';
import CrudHeader from '../../components/CrudHeader';
import FilterSidebar from '../../components/FilterSidebar';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../components/StatusDropdown';
import TableActions from '../../components/TableActions';
import HistoryDialog from '../../components/HistoryDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeleteDialog from '../../components/DeleteDialog';
import TemplateDialog from './components/TemplateDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import { midiaKitService, MidiaKitTemplateDTO, MidiaKitFiltros } from './service';
import './styles.scss';

function MidiaKits() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<MidiaKitFiltros>({ status: [] });
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<MidiaKitTemplateDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MidiaKitTemplateDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: MidiaKitFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['midia-kits', currentPage, pageSize, queryFiltros],
    queryFn: () => midiaKitService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['midia-kits'] });
  const mostrar = (severity: 'success' | 'error', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : 'Erro', detail });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => midiaKitService.desativar(id),
    onSuccess: () => { mostrar('success', 'Template desativado'); setDeactivateTarget(null); invalidate(); },
    onError: () => mostrar('error', 'Erro ao desativar'),
  });
  const restaurarMutation = useMutation({
    mutationFn: (id: string) => midiaKitService.restaurar(id),
    onSuccess: () => { mostrar('success', 'Template restaurado'); invalidate(); },
    onError: () => mostrar('error', 'Erro ao restaurar'),
  });
  const excluirMutation = useMutation({
    mutationFn: (id: string) => midiaKitService.excluir(id),
    onSuccess: () => { mostrar('success', 'Template excluído'); setDeleteTarget(null); invalidate(); },
    onError: () => mostrar('error', 'Erro ao excluir'),
  });
  const copiarMutation = useMutation({
    mutationFn: (id: string) => midiaKitService.copiar(id),
    onSuccess: () => { mostrar('success', 'Template copiado'); invalidate(); },
    onError: () => mostrar('error', 'Erro ao copiar'),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'MidiaKitTemplate') invalidate(); });
    return unsub;
  }, [subscribe, queryClient]);

  const roles = authUser?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.MIDIA_KIT.prefix);
  const podeEditar = canChange(roles, MODULES.MIDIA_KIT.prefix);
  const podeExcluir = canDelete(roles, MODULES.MIDIA_KIT.prefix);

  const abrirNovo = () => { setEditId(null); setDialogVisible(true); };
  const abrirEdicao = (row: MidiaKitTemplateDTO) => { setEditId(row.id); setDialogVisible(true); };

  const statusTemplate = (row: MidiaKitTemplateDTO) => <StatusBadge status={row.status} />;
  const influTemplate = (row: MidiaKitTemplateDTO) => row.influenciadorNome || <span className="text-muted">&mdash;</span>;
  const sessoesTemplate = (row: MidiaKitTemplateDTO) => <span className="qtd-badge">{row.qtdSessoes} seções</span>;

  const acoesTemplate = (row: MidiaKitTemplateDTO) => (
    <div className="midiakit-acoes">
      <button type="button" className="acao-copiar" title="Copiar template" onClick={() => copiarMutation.mutate(row.id)} disabled={!podeAdicionar}>
        <i className="pi pi-copy" />
      </button>
      <TableActions
        onHistory={() => { setHistoryId(row.id); setHistoryVisible(true); }}
        onEdit={() => abrirEdicao(row)}
        onDeactivate={() => setDeactivateTarget(row)}
        onRestore={() => restaurarMutation.mutate(row.id)}
        onDelete={() => setDeleteTarget(row)}
        showHistory
        showEdit={podeEditar && row.status === 'ATIVO'}
        showDeactivate={podeExcluir && row.status === 'ATIVO'}
        showRestore={row.status === 'INATIVO'}
        showDelete={podeExcluir && row.status === 'INATIVO'}
      />
    </div>
  );

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.nome || !!filtros.influenciador || !!filtros.criadoPor;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Mídia Kits" subtitle={mostrarInativos ? 'Templates desativados' : 'Templates de mídia kit por influenciador'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por nome, influenciador..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Novo Template" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum template desativado' : 'Nenhum template encontrado'} stripedRows removableSort
        >
          <Column field="nome" header="Nome" sortable />
          <Column field="influenciadorNome" header="Influenciador" body={influTemplate} sortable />
          <Column header="Seções" body={sessoesTemplate} style={{ width: '120px' }} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '130px' }} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '200px' }} />
        </DataTable>
      </div>

      <TemplateDialog visible={dialogVisible} templateId={editId} onHide={() => setDialogVisible(false)} onToast={mostrar} />

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Template" icon="pi pi-ban" message={`Deseja desativar o template "${deactivateTarget?.nome}"?`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.nome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/midiakit-templates" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-nome">Nome</label>
          <InputText id="filter-nome" value={filtros.nome ?? ''} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value || undefined })} placeholder="Filtrar por nome" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-influ">Influenciador</label>
          <InputText id="filter-influ" value={filtros.influenciador ?? ''} onChange={(e) => setFiltros({ ...filtros, influenciador: e.target.value || undefined })} placeholder="Filtrar por influenciador" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-status">Status</label>
          <MultiSelect id="filter-status" value={filtros.status} options={STATUS_OPTIONS} onChange={(e) => setFiltros({ ...filtros, status: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-criado">Criado por</label>
          <InputText id="filter-criado" value={filtros.criadoPor ?? ''} onChange={(e) => setFiltros({ ...filtros, criadoPor: e.target.value || undefined })} placeholder="E-mail do criador" className="w-full" />
        </div>
      </FilterSidebar>
    </div>
  );
}

export default MidiaKits;
