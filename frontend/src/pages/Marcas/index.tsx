import { useState, useEffect, useRef } from 'react';
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
import MarcaFormDialog from './components/MarcaFormDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import { marcaService, MarcaDTO, MarcaFiltros } from './service';
import './styles.scss';

function Marcas() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<MarcaFiltros>({ status: [] });
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<MarcaDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarcaDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: MarcaFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['marcas', currentPage, pageSize, queryFiltros],
    queryFn: () => marcaService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['marcas'] });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => marcaService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Marca desativada' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });

  const restaurarMutation = useMutation({
    mutationFn: (id: string) => marcaService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Marca restaurada' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => marcaService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Marca excluída permanentemente' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Marca') invalidate(); });
    return unsub;
  }, [subscribe, queryClient]);

  const abrirNovo = () => { setEditId(null); setDialogVisible(true); };
  const abrirEdicao = (row: MarcaDTO) => { setEditId(row.id); setDialogVisible(true); };

  const roles = authUser?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.MARCAS.prefix);
  const podeEditar = canChange(roles, MODULES.MARCAS.prefix);
  const podeExcluir = canDelete(roles, MODULES.MARCAS.prefix);

  const statusTemplate = (row: MarcaDTO) => <StatusBadge status={row.status} />;
  const contatosTemplate = (row: MarcaDTO) => <span className="qtd-badge">{row.qtdContatos} contato{row.qtdContatos === 1 ? '' : 's'}</span>;
  const acoesTemplate = (row: MarcaDTO) => (
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
  );

  const formatDate = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.nome || !!filtros.criadoPor || !!filtros.registroDe || !!filtros.registroAte;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Marcas" subtitle={mostrarInativos ? 'Registros desativados' : 'Gerenciamento de marcas e contatos'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por nome..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Nova Marca" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhuma marca encontrada'} stripedRows removableSort
        >
          <Column field="nome" header="Nome" sortable />
          <Column header="Contatos" body={contatosTemplate} style={{ width: '140px' }} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '130px' }} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '160px' }} />
        </DataTable>
      </div>

      <MarcaFormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} editId={editId} />

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Marca" icon="pi pi-ban" message={`Deseja desativar a marca "${deactivateTarget?.nome}"? O registro poderá ser restaurado posteriormente.`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.nome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/marcas" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-nome">Nome</label>
          <InputText id="filter-nome" value={filtros.nome ?? ''} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value || undefined })} placeholder="Filtrar por nome" className="w-full" />
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

export default Marcas;
