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
import FormDialog from '../../components/FormDialog';
import FilterSidebar from '../../components/FilterSidebar';
import StatusBadge from '../../components/StatusBadge';
import StatusDropdown, { STATUS_OPTIONS } from '../../components/StatusDropdown';
import TableActions from '../../components/TableActions';
import HistoryDialog from '../../components/HistoryDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeleteDialog from '../../components/DeleteDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import { usuarioService, UsuarioDTO, UsuarioForm, UsuarioFiltros, Perfil } from './service';
import './styles.scss';

interface FormErrors { nome?: string; email?: string; senha?: string; }

function Usuarios() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const location = useLocation();
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<UsuarioFiltros>({ status: [], perfil: [] });
  const [form, setForm] = useState<UsuarioForm>({ nome: '', email: '', senha: '', status: 'ATIVO', perfis: [] });
  const [formId, setFormId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<UsuarioDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: UsuarioFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['usuarios', currentPage, pageSize, queryFiltros],
    queryFn: () => usuarioService.listar(currentPage, pageSize, queryFiltros),
  });

  const { data: perfisOptions = [] } = useQuery({
    queryKey: ['perfis-options'],
    queryFn: () => usuarioService.listarPerfis(),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['usuarios'] });

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<UsuarioForm> = { ...form };
      if (editando && !payload.senha) delete payload.senha;
      return editando ? usuarioService.atualizar(formId!, payload) : usuarioService.salvar(payload);
    },
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Usuário atualizado' : 'Usuário criado' }); setDialogVisible(false); invalidate(); },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => usuarioService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Usuário desativado' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });

  const restaurarMutation = useMutation({
    mutationFn: (id: string) => usuarioService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Usuário restaurado' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => usuarioService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Usuário excluído permanentemente' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Usuario') invalidate(); });
    return unsub;
  }, [subscribe, queryClient]);

  useEffect(() => {
    const state = location.state as { abrirNovo?: boolean } | null;
    if (state?.abrirNovo) {
      setForm({ nome: '', email: '', senha: '', status: 'ATIVO', perfis: [] });
      setFormId(null); setEditando(false); setErrors({}); setSubmitted(false); setDialogVisible(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório';
    if (!editando && !form.senha.trim()) errs.senha = 'Senha é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const abrirNovo = () => { setForm({ nome: '', email: '', senha: '', status: 'ATIVO', perfis: [] }); setFormId(null); setEditando(false); setErrors({}); setSubmitted(false); setDialogVisible(true); };

  const abrirEdicao = async (row: UsuarioDTO) => {
    try {
      const data = await usuarioService.buscar(row.id);
      setForm({ nome: data.nome, email: data.email, senha: '', status: data.status, perfis: data.perfis || [] });
      setFormId(row.id); setEditando(true); setErrors({}); setSubmitted(false); setDialogVisible(true);
    } catch { toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar usuário' }); }
  };

  const salvar = () => { setSubmitted(true); if (!validar()) return; salvarMutation.mutate(); };

  const perfisTemplate = (rowData: UsuarioDTO) => {
    if (!rowData.perfis) return <span className="text-muted">&mdash;</span>;
    const lista = rowData.perfis.split(', ').filter(Boolean);
    if (!lista.length) return <span className="text-muted">&mdash;</span>;
    return (<div className="perfis-chips">{lista.map((nome) => (<span key={nome} className="perfil-chip"><i className="pi pi-shield" />{nome}</span>))}</div>);
  };

  const roles = authUser?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.USUARIOS.prefix);
  const podeEditar = canChange(roles, MODULES.USUARIOS.prefix);
  const podeExcluir = canDelete(roles, MODULES.USUARIOS.prefix);

  const statusTemplate = (rowData: UsuarioDTO) => <StatusBadge status={rowData.status} />;
  const acoesTemplate = (rowData: UsuarioDTO) => (
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

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.perfil?.length || !!filtros.nome || !!filtros.email || !!filtros.criadoPor || !!filtros.registroDe || !!filtros.registroAte || !!filtros.modificacaoDe || !!filtros.modificacaoAte;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Usuários" subtitle={mostrarInativos ? 'Registros desativados' : 'Gerenciamento de usuários do sistema'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por nome, e-mail..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Novo Usuário" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhum usuário encontrado'} stripedRows removableSort
        >
          <Column field="nome" header="Nome" sortable />
          <Column field="email" header="E-mail" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '130px' }} />
          <Column header="Perfis" body={perfisTemplate} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '160px' }} />
        </DataTable>
      </div>

      <FormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} title={editando ? 'Editar Usuário' : 'Novo Usuário'} icon={editando ? 'pi pi-user-edit' : 'pi pi-user-plus'} onSave={salvar} loading={salvarMutation.isPending}>
        <div className={`form-field ${submitted && errors.nome ? 'field-error' : ''}`}>
          <label htmlFor="nome">Nome <span className="required">*</span></label>
          <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" />
          {submitted && errors.nome && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.nome}</small>}
        </div>
        <div className={`form-field ${submitted && errors.email ? 'field-error' : ''}`}>
          <label htmlFor="email">E-mail <span className="required">*</span></label>
          <InputText id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full" />
          {submitted && errors.email && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.email}</small>}
        </div>
        <div className={`form-field ${submitted && errors.senha ? 'field-error' : ''}`}>
          <label htmlFor="senha">Senha {!editando && <span className="required">*</span>} {editando && <small>(deixe em branco para manter)</small>}</label>
          <InputText id="senha" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className="w-full" />
          {submitted && errors.senha && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.senha}</small>}
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
        <div className="form-field">
          <label htmlFor="perfis">Perfis</label>
          <MultiSelect id="perfis" value={form.perfis} options={perfisOptions} onChange={(e) => setForm({ ...form, perfis: e.value })} optionLabel="descricao" placeholder="Selecione os perfis" className="w-full" display="chip" baseZIndex={10000} />
        </div>
      </FormDialog>

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Registro" icon="pi pi-ban" message={`Deseja desativar o usuário "${deactivateTarget?.nome}"? O registro poderá ser restaurado posteriormente.`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.nome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/usuarios" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [], perfil: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-nome">Nome</label>
          <InputText id="filter-nome" value={filtros.nome ?? ''} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value || undefined })} placeholder="Filtrar por nome" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-email">E-mail</label>
          <InputText id="filter-email" value={filtros.email ?? ''} onChange={(e) => setFiltros({ ...filtros, email: e.target.value || undefined })} placeholder="Filtrar por e-mail" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-status">Status</label>
          <MultiSelect id="filter-status" value={filtros.status} options={STATUS_OPTIONS} onChange={(e) => setFiltros({ ...filtros, status: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-perfil">Perfil</label>
          <MultiSelect id="filter-perfil" value={filtros.perfil} options={perfisOptions.map((p: Perfil) => ({ label: p.descricao, value: p.descricao }))} onChange={(e) => setFiltros({ ...filtros, perfil: e.value })} placeholder="Todos" className="w-full" display="chip" />
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
        <div className="filter-date-group">
          <label>Última modificação</label>
          <div className="filter-date-range">
            <Calendar value={filtros.modificacaoDe ? new Date(filtros.modificacaoDe + 'T00:00:00') : null} onChange={(e) => setFiltros({ ...filtros, modificacaoDe: formatDate(e.value as Date) })} placeholder="De" dateFormat="dd/mm/yy" showIcon className="w-full" />
            <Calendar value={filtros.modificacaoAte ? new Date(filtros.modificacaoAte + 'T00:00:00') : null} onChange={(e) => setFiltros({ ...filtros, modificacaoAte: formatDate(e.value as Date) })} placeholder="Até" dateFormat="dd/mm/yy" showIcon className="w-full" />
          </div>
        </div>
      </FilterSidebar>
    </div>
  );
}

export default Usuarios;
