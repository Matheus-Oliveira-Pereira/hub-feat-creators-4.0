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
import FormDialog from '../../components/FormDialog';
import FilterSidebar from '../../components/FilterSidebar';
import StatusBadge from '../../components/StatusBadge';
import StatusDropdown, { STATUS_OPTIONS } from '../../components/StatusDropdown';
import TableActions from '../../components/TableActions';
import HistoryDialog from '../../components/HistoryDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeleteDialog from '../../components/DeleteDialog';
import RoleBoards from './components/RoleBoards';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import { perfilService, PerfilDTO, PerfilForm, PerfilFiltros } from './service';
import './styles.scss';

interface FormErrors { descricao?: string; }

function Perfis() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<PerfilFiltros>({ status: [], role: [] });
  const [form, setForm] = useState<PerfilForm>({ descricao: '', status: 'ATIVO', roles: [] });
  const [formId, setFormId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<PerfilDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PerfilDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: PerfilFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['perfis', currentPage, pageSize, queryFiltros],
    queryFn: () => perfilService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['perfis'] });

  const salvarMutation = useMutation({
    mutationFn: async () => editando ? perfilService.atualizar(formId!, form) : perfilService.salvar(form),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Perfil atualizado' : 'Perfil criado' }); setDialogVisible(false); invalidate(); },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => perfilService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Perfil desativado' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });

  const restaurarMutation = useMutation({
    mutationFn: (id: string) => perfilService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Perfil restaurado' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => perfilService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Perfil excluído permanentemente' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Perfil') invalidate(); });
    return unsub;
  }, [subscribe, queryClient]);

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.descricao.trim()) errs.descricao = 'Descrição é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const abrirNovo = () => { setForm({ descricao: '', status: 'ATIVO', roles: [] }); setFormId(null); setEditando(false); setErrors({}); setSubmitted(false); setDialogVisible(true); };

  const abrirEdicao = async (row: PerfilDTO) => {
    try {
      const data = await perfilService.buscar(row.id);
      const rolesArr = Array.isArray(data.roles) ? data.roles.map((r: unknown) => typeof r === 'string' ? r : (r as { name?: string }).name || String(r)) : [];
      setForm({ descricao: data.descricao, status: data.status, roles: rolesArr });
      setFormId(row.id); setEditando(true); setErrors({}); setSubmitted(false); setDialogVisible(true);
    } catch { toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar perfil' }); }
  };

  const salvar = () => { setSubmitted(true); if (!validar()) return; salvarMutation.mutate(); };

  const rolesTemplate = (rowData: PerfilDTO) => {
    if (!rowData.roles?.length) return <span className="text-muted">&mdash;</span>;
    return (<div className="roles-chips">{rowData.roles.map((role) => (<span key={role} className="role-chip">{role}</span>))}</div>);
  };

  const formatDate = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  const roleOptions = Object.values(MODULES).flatMap((m) =>
    ['A', 'B', 'C', 'D'].map((s) => ({ label: `${m.prefix}${s}`, value: `${m.prefix}${s}` }))
  );

  const userRoles = authUser?.roles ?? [];
  const podeAdicionar = canAdd(userRoles, MODULES.PERFIS.prefix);
  const podeEditar = canChange(userRoles, MODULES.PERFIS.prefix);
  const podeExcluir = canDelete(userRoles, MODULES.PERFIS.prefix);

  const statusTemplate = (rowData: PerfilDTO) => <StatusBadge status={rowData.status} />;
  const acoesTemplate = (rowData: PerfilDTO) => (
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

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Perfis" subtitle={mostrarInativos ? 'Registros desativados' : 'Gerenciamento de perfis e permissões'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por descrição..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Novo Perfil" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhum perfil encontrado'} stripedRows removableSort
        >
          <Column field="descricao" header="Descrição" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '130px' }} />
          <Column header="Roles" body={rolesTemplate} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '160px' }} />
        </DataTable>
      </div>

      <FormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} title={editando ? 'Editar Perfil' : 'Novo Perfil'} icon={editando ? 'pi pi-shield' : 'pi pi-plus-circle'} onSave={salvar} loading={salvarMutation.isPending} width="600px">
        <div className={`form-field ${submitted && errors.descricao ? 'field-error' : ''}`}>
          <label htmlFor="descricao">Descrição <span className="required">*</span></label>
          <InputText id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full" />
          {submitted && errors.descricao && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.descricao}</small>}
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
        <RoleBoards selectedRoles={form.roles} onChange={(r) => setForm({ ...form, roles: r })} />
      </FormDialog>

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Registro" icon="pi pi-ban" message={`Deseja desativar o perfil "${deactivateTarget?.descricao}"? O registro poderá ser restaurado posteriormente.`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.descricao} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/perfis" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [], role: [] }); setCurrentPage(0); }} clearDisabled={!filtros.status?.length && !filtros.descricao && !filtros.role?.length && !filtros.criadoPor && !filtros.registroDe && !filtros.registroAte}>
        <div className="form-field">
          <label htmlFor="filter-descricao">Descrição</label>
          <InputText id="filter-descricao" value={filtros.descricao ?? ''} onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value || undefined })} placeholder="Filtrar por descrição" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-status">Status</label>
          <MultiSelect id="filter-status" value={filtros.status} options={STATUS_OPTIONS} onChange={(e) => setFiltros({ ...filtros, status: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-role">Permissões</label>
          <MultiSelect id="filter-role" value={filtros.role} options={roleOptions} onChange={(e) => setFiltros({ ...filtros, role: e.value })} placeholder="Todas" className="w-full" display="chip" />
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

export default Perfis;
