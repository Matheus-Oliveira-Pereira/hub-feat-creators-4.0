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
import ContatosEditor from './components/ContatosEditor';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import { marcaService, MarcaDTO, MarcaForm, MarcaFiltros, Contato, contatoVazio, contatoInvalido } from './service';
import { comprimirImagem } from '../../utils/imagem';
import './styles.scss';

const FORM_VAZIO: MarcaForm = { nome: '', status: 'ATIVO', logotipo: '', contatos: [] };

function Marcas() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<MarcaFiltros>({ status: [] });
  const [form, setForm] = useState<MarcaForm>(FORM_VAZIO);
  const [formId, setFormId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<MarcaDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarcaDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const carregarLogotipo = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const dataUrl = await comprimirImagem(files[0]);
      setForm((f) => ({ ...f, logotipo: dataUrl }));
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar o logotipo' });
    }
    if (logoRef.current) logoRef.current.value = '';
  };

  const queryFiltros: MarcaFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['marcas', currentPage, pageSize, queryFiltros],
    queryFn: () => marcaService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['marcas'] });

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: MarcaForm = { ...form, contatos: form.contatos.filter((c) => !contatoVazio(c)) };
      return editando ? marcaService.atualizar(formId!, payload) : marcaService.salvar(payload);
    },
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Marca atualizada' : 'Marca criada' }); setDialogVisible(false); invalidate(); },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

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

  const validar = (): boolean => {
    if (!form.nome.trim()) return false;
    return !form.contatos.some(contatoInvalido);
  };

  const abrirNovo = () => { setForm(FORM_VAZIO); setFormId(null); setEditando(false); setSubmitted(false); setDialogVisible(true); };

  const abrirEdicao = async (row: MarcaDTO) => {
    try {
      const data = await marcaService.buscar(row.id);
      setForm({
        nome: data.nome,
        status: data.status,
        logotipo: data.logotipo ?? '',
        contatos: (data.contatos || []).map((c) => ({ id: c.id, nome: c.nome ?? '', email: c.email ?? '', telefone: c.telefone ?? '' })),
      });
      setFormId(row.id); setEditando(true); setSubmitted(false); setDialogVisible(true);
    } catch { toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar marca' }); }
  };

  const salvar = () => {
    setSubmitted(true);
    if (!validar()) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Verifique o nome e os contatos.' });
      return;
    }
    salvarMutation.mutate();
  };

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

      <FormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} title={editando ? 'Editar Marca' : 'Nova Marca'} icon={editando ? 'pi pi-pencil' : 'pi pi-plus'} onSave={salvar} loading={salvarMutation.isPending} width="640px">
        <div className={`form-field ${submitted && !form.nome.trim() ? 'field-error' : ''}`}>
          <label htmlFor="nome">Nome <span className="required">*</span></label>
          <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" />
          {submitted && !form.nome.trim() && <small className="p-error"><i className="pi pi-exclamation-circle" />Nome é obrigatório</small>}
        </div>
        <div className="form-field">
          <label htmlFor="logotipo">Logotipo</label>
          <div className="logo-upload">
            {form.logotipo
              ? (
                <div className="logo-preview">
                  <img src={form.logotipo} alt="Logotipo" />
                  <button type="button" onClick={() => setForm({ ...form, logotipo: '' })} title="Remover"><i className="pi pi-times" /></button>
                </div>
              )
              : (
                <label className="logo-add">
                  <i className="pi pi-upload" /> Enviar imagem
                  <input ref={logoRef} id="logotipo" type="file" accept="image/*" onChange={(e) => carregarLogotipo(e.target.files)} />
                </label>
              )}
          </div>
        </div>
        <div className="form-field">
          <ContatosEditor contatos={form.contatos} onChange={(contatos: Contato[]) => setForm({ ...form, contatos })} submitted={submitted} />
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </FormDialog>

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
