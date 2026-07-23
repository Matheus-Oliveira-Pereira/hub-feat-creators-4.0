import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
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
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import ImportacaoDialog from './components/ImportacaoDialog';
import InfluenciadorFormDialog from './components/InfluenciadorFormDialog';
import { influenciadorService, InfluenciadorDTO, InfluenciadorFiltros } from './service';
import './styles.scss';

function Influenciadores() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const location = useLocation();
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<InfluenciadorFiltros>({ status: [] });
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<InfluenciadorDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InfluenciadorDTO | null>(null);
  const [importVisible, setImportVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: InfluenciadorFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['influenciadores', currentPage, pageSize, queryFiltros],
    queryFn: () => influenciadorService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['influenciadores'] });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => influenciadorService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Influenciador desativado' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });

  const restaurarMutation = useMutation({
    mutationFn: (id: string) => influenciadorService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Influenciador restaurado' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => influenciadorService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Influenciador excluído permanentemente' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Influenciador') invalidate(); });
    return unsub;
  }, [subscribe, queryClient]);

  useEffect(() => {
    const state = location.state as { abrirNovo?: boolean } | null;
    if (state?.abrirNovo) {
      setEditId(null); setDialogVisible(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const abrirNovo = () => { setEditId(null); setDialogVisible(true); };
  const abrirEdicao = (row: InfluenciadorDTO) => { setEditId(row.id); setDialogVisible(true); };

  const roles = authUser?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.INFLUENCIADORES.prefix);
  const podeEditar = canChange(roles, MODULES.INFLUENCIADORES.prefix);
  const podeExcluir = canDelete(roles, MODULES.INFLUENCIADORES.prefix);

  const inicial = (nome: string) => (nome.trim()[0] || '?').toUpperCase();

  const nomeTemplate = (rowData: InfluenciadorDTO) => (
    <div className="influ-nome">
      <span className="influ-avatar">{inicial(rowData.nome)}</span>
      <span>{rowData.nome}</span>
    </div>
  );
  const instagramTemplate = (rowData: InfluenciadorDTO) =>
    rowData.instagram ? <span className="influ-social"><i className="pi pi-instagram" />{rowData.instagram}</span> : <span className="text-muted">&mdash;</span>;
  const telefoneTemplate = (rowData: InfluenciadorDTO) => rowData.telefone || <span className="text-muted">&mdash;</span>;
  const statusTemplate = (rowData: InfluenciadorDTO) => <StatusBadge status={rowData.status} />;
  const acoesTemplate = (rowData: InfluenciadorDTO) => (
    <TableActions
      onHistory={() => { setHistoryId(rowData.id); setHistoryVisible(true); }}
      onEdit={() => abrirEdicao(rowData)}
      onDeactivate={() => setDeactivateTarget(rowData)}
      onRestore={() => restaurarMutation.mutate(rowData.id)}
      onDelete={() => setDeleteTarget(rowData)}
      showHistory
      showEdit={podeEditar && rowData.status === 'ATIVO'}
      showDeactivate={podeExcluir && rowData.status === 'ATIVO'}
      showRestore={rowData.status === 'INATIVO'}
      showDelete={podeExcluir && rowData.status === 'INATIVO'}
    />
  );

  const formatDate = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.nome || !!filtros.email || !!filtros.instagram || !!filtros.criadoPor || !!filtros.registroDe || !!filtros.registroAte;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Influenciadores" subtitle={mostrarInativos ? 'Registros desativados' : 'Gerenciamento de influenciadores'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por nome, e-mail, instagram..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Novo Influenciador" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            >
              {podeAdicionar && <button type="button" className="btn-importar" onClick={() => setImportVisible(true)}><i className="pi pi-file-import" /> Importar CSV</button>}
            </CrudHeader>
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhum influenciador encontrado'} stripedRows removableSort
        >
          <Column field="nome" header="Nome" body={nomeTemplate} sortable />
          <Column field="email" header="E-mail" sortable />
          <Column field="telefone" header="Telefone" body={telefoneTemplate} />
          <Column field="instagram" header="Instagram" body={instagramTemplate} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '130px' }} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '160px' }} />
        </DataTable>
      </div>

      <InfluenciadorFormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} editId={editId} />

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Registro" icon="pi pi-ban" message={`Deseja desativar o influenciador "${deactivateTarget?.nome}"? O registro poderá ser restaurado posteriormente.`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.nome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/influenciadores" />

      <ImportacaoDialog visible={importVisible} onHide={() => setImportVisible(false)} onComplete={invalidate} />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-nome">Nome</label>
          <InputText id="filter-nome" value={filtros.nome ?? ''} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value || undefined })} placeholder="Filtrar por nome" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-email">E-mail</label>
          <InputText id="filter-email" value={filtros.email ?? ''} onChange={(e) => setFiltros({ ...filtros, email: e.target.value || undefined })} placeholder="Filtrar por e-mail" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-instagram">Instagram</label>
          <InputText id="filter-instagram" value={filtros.instagram ?? ''} onChange={(e) => setFiltros({ ...filtros, instagram: e.target.value || undefined })} placeholder="Filtrar por instagram" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-status">Status</label>
          <MultiSelect id="filter-status" value={filtros.status} options={STATUS_OPTIONS} onChange={(e) => setFiltros({ ...filtros, status: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-criado">Criado por</label>
          <InputText id="filter-criado" value={filtros.criadoPor ?? ''} onChange={(e) => setFiltros({ ...filtros, criadoPor: e.target.value || undefined })} placeholder="E-mail do criador" className="w-full" />
        </div>
        <div className="filter-date-group">
          <label>Data de criação</label>
          <div className="filter-date-range">
            <Calendar value={filtros.registroDe ? new Date(filtros.registroDe + 'T00:00:00') : null} onChange={(e) => setFiltros({ ...filtros, registroDe: formatDate(e.value as Date) })} placeholder="De" dateFormat="dd/mm/yy" showIcon className="w-full" />
            <Calendar value={filtros.registroAte ? new Date(filtros.registroAte + 'T00:00:00') : null} onChange={(e) => setFiltros({ ...filtros, registroAte: formatDate(e.value as Date) })} placeholder="Até" dateFormat="dd/mm/yy" showIcon className="w-full" />
          </div>
        </div>
      </FilterSidebar>
    </div>
  );
}

export default Influenciadores;
