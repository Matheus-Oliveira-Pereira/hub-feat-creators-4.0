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
import ImportacaoDialog from './components/ImportacaoDialog';
import { influenciadorService, InfluenciadorDTO, InfluenciadorForm, InfluenciadorFiltros } from './service';
import './styles.scss';

interface FormErrors { nome?: string; email?: string; }

const FORM_VAZIO: InfluenciadorForm = {
  nome: '', email: '', telefone: '', instagram: '', tiktok: '', linkedin: '', youtube: '', discord: '',
  nicho: '', subnicho: '', foto: '', status: 'ATIVO',
};

function Influenciadores() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const location = useLocation();
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<InfluenciadorFiltros>({ status: [] });
  const [form, setForm] = useState<InfluenciadorForm>(FORM_VAZIO);
  const [formId, setFormId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
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

  const salvarMutation = useMutation({
    mutationFn: async () => (editando ? influenciadorService.atualizar(formId!, form) : influenciadorService.salvar(form)),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Influenciador atualizado' : 'Influenciador criado' }); setDialogVisible(false); invalidate(); },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

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
      setForm(FORM_VAZIO);
      setFormId(null); setEditando(false); setErrors({}); setSubmitted(false); setDialogVisible(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'E-mail inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const abrirNovo = () => { setForm(FORM_VAZIO); setFormId(null); setEditando(false); setErrors({}); setSubmitted(false); setDialogVisible(true); };

  const abrirEdicao = async (row: InfluenciadorDTO) => {
    try {
      const data = await influenciadorService.buscar(row.id);
      setForm({
        nome: data.nome, email: data.email,
        telefone: data.telefone ?? '', instagram: data.instagram ?? '', tiktok: data.tiktok ?? '',
        linkedin: data.linkedin ?? '', youtube: data.youtube ?? '', discord: data.discord ?? '',
        nicho: data.nicho ?? '', subnicho: data.subnicho ?? '', foto: data.foto ?? '', status: data.status,
      });
      setFormId(row.id); setEditando(true); setErrors({}); setSubmitted(false); setDialogVisible(true);
    } catch { toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar influenciador' }); }
  };

  const salvar = () => { setSubmitted(true); if (!validar()) return; salvarMutation.mutate(); };

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

      <FormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} title={editando ? 'Editar Influenciador' : 'Novo Influenciador'} icon={editando ? 'pi pi-user-edit' : 'pi pi-user-plus'} onSave={salvar} loading={salvarMutation.isPending}>
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
        <div className="form-field">
          <label htmlFor="telefone">Telefone</label>
          <InputText id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full" />
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="instagram"><i className="pi pi-instagram" /> Instagram</label>
            <InputText id="instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full" placeholder="@usuario" />
          </div>
          <div className="form-field">
            <label htmlFor="tiktok"><i className="pi pi-video" /> TikTok</label>
            <InputText id="tiktok" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} className="w-full" placeholder="@usuario" />
          </div>
          <div className="form-field">
            <label htmlFor="linkedin"><i className="pi pi-linkedin" /> LinkedIn</label>
            <InputText id="linkedin" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="w-full" />
          </div>
          <div className="form-field">
            <label htmlFor="youtube"><i className="pi pi-youtube" /> YouTube</label>
            <InputText id="youtube" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} className="w-full" />
          </div>
          <div className="form-field">
            <label htmlFor="discord"><i className="pi pi-discord" /> Discord</label>
            <InputText id="discord" value={form.discord} onChange={(e) => setForm({ ...form, discord: e.target.value })} className="w-full" placeholder="Servidor / convite" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="nicho">Nicho</label>
            <InputText id="nicho" value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })} className="w-full" placeholder="Ex: Tecnologia" />
          </div>
          <div className="form-field">
            <label htmlFor="subnicho">Subnicho</label>
            <InputText id="subnicho" value={form.subnicho} onChange={(e) => setForm({ ...form, subnicho: e.target.value })} className="w-full" placeholder="Ex: Programação & IA" />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="foto">Foto (URL)</label>
          <InputText id="foto" value={form.foto} onChange={(e) => setForm({ ...form, foto: e.target.value })} className="w-full" placeholder="https://..." />
          {form.foto.trim() && <img src={form.foto} alt="Pré-visualização" className="influ-foto-preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </FormDialog>

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
