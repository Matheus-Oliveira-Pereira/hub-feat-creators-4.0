import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
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
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import ImportacaoDialog from './components/ImportacaoDialog';
import { contaEmailService, ContaEmailDTO, ContaEmailForm, ContaEmailFiltros } from './service';
import './styles.scss';

interface FormErrors { nome?: string; host?: string; usuario?: string; }

const FORM_VAZIO: ContaEmailForm = {
  nome: '', host: '', porta: 587, usuario: '', remetenteNome: '', senha: '', tls: true, sistema: false, status: 'ATIVO',
};

function ContasEmail() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<ContaEmailFiltros>({ status: [] });
  const [form, setForm] = useState<ContaEmailForm>(FORM_VAZIO);
  const [formId, setFormId] = useState<string | null>(null);
  const [senhaConfigurada, setSenhaConfigurada] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ContaEmailDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContaEmailDTO | null>(null);
  const [testeTarget, setTesteTarget] = useState<ContaEmailDTO | null>(null);
  const [testeDestino, setTesteDestino] = useState('');
  const [importVisible, setImportVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: ContaEmailFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['contas-email', currentPage, pageSize, queryFiltros],
    queryFn: () => contaEmailService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contas-email'] });
    queryClient.invalidateQueries({ queryKey: ['contas-email-options'] });
  };

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<ContaEmailForm> = { ...form };
      if (!payload.senha?.trim()) delete payload.senha;
      return editando ? contaEmailService.atualizar(formId!, payload) : contaEmailService.salvar(payload);
    },
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Conta atualizada' : 'Conta criada' }); setDialogVisible(false); invalidate(); },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => contaEmailService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Conta desativada' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });

  const restaurarMutation = useMutation({
    mutationFn: (id: string) => contaEmailService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Conta restaurada' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => contaEmailService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Conta excluída permanentemente' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  const testeMutation = useMutation({
    mutationFn: () => contaEmailService.enviarTeste(testeTarget!.id, testeDestino.trim()),
    onSuccess: (res) => {
      if (res.sucesso) {
        toast.current?.show({ severity: 'success', summary: 'E-mail enviado', detail: `Teste enviado para ${testeDestino.trim()}` });
        setTesteTarget(null);
      } else {
        toast.current?.show({ severity: 'error', summary: 'Falha no envio', detail: res.erro || 'Não foi possível enviar.', life: 6000 });
      }
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao enviar teste' }); },
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!form.host.trim()) errs.host = 'Servidor SMTP é obrigatório';
    if (!form.usuario.trim()) errs.usuario = 'Usuário (e-mail) é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.usuario.trim())) errs.usuario = 'E-mail inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const abrirNovo = () => { setForm(FORM_VAZIO); setFormId(null); setEditando(false); setSenhaConfigurada(false); setErrors({}); setSubmitted(false); setDialogVisible(true); };

  const abrirEdicao = async (row: ContaEmailDTO) => {
    try {
      const data = await contaEmailService.buscar(row.id);
      setForm({
        nome: data.nome, host: data.host, porta: data.porta, usuario: data.usuario,
        remetenteNome: data.remetenteNome ?? '', senha: '', tls: data.tls ?? true,
        sistema: data.sistema, status: data.status,
      });
      setSenhaConfigurada(true);
      setFormId(row.id); setEditando(true); setErrors({}); setSubmitted(false); setDialogVisible(true);
    } catch { toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar conta' }); }
  };

  const salvar = () => {
    setSubmitted(true);
    if (!validar()) return;
    salvarMutation.mutate();
  };

  const roles = authUser?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.CONTAS_EMAIL.prefix);
  const podeEditar = canChange(roles, MODULES.CONTAS_EMAIL.prefix);
  const podeExcluir = canDelete(roles, MODULES.CONTAS_EMAIL.prefix);

  const formatDate = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  const sistemaTemplate = (row: ContaEmailDTO) =>
    row.sistema ? <Tag value="Sistema" severity="info" /> : <span className="text-muted">&mdash;</span>;
  const statusTemplate = (row: ContaEmailDTO) => <StatusBadge status={row.status} />;
  const acoesTemplate = (row: ContaEmailDTO) => (
    <div className="contas-acoes">
      {podeEditar && row.status === 'ATIVO' && (
        <>
          <Tooltip target={`#teste-${row.id}`} position="top" />
          <button id={`teste-${row.id}`} type="button" className="action-btn btn-teste-conta" onClick={() => { setTesteTarget(row); setTesteDestino(''); }} data-pr-tooltip="Enviar e-mail de teste">
            <i className="pi pi-send" />
          </button>
        </>
      )}
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

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.nome || !!filtros.usuario || !!filtros.criadoPor || !!filtros.registroDe || !!filtros.registroAte;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Contas de E-mail" subtitle={mostrarInativos ? 'Registros desativados' : 'Contas SMTP usadas para envio'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por nome, usuário, host..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Nova Conta" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            >
              {podeAdicionar && <button type="button" className="btn-importar" onClick={() => setImportVisible(true)}><i className="pi pi-file-import" /> Importar CSV</button>}
            </CrudHeader>
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhuma conta cadastrada'} stripedRows
        >
          <Column field="nome" header="Nome" sortable />
          <Column field="usuario" header="Usuário" />
          <Column field="host" header="Servidor" />
          <Column field="porta" header="Porta" style={{ width: '90px' }} />
          <Column field="sistema" header="Padrão" body={sistemaTemplate} style={{ width: '110px' }} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '200px' }} />
        </DataTable>
      </div>

      <FormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} title={editando ? 'Editar Conta' : 'Nova Conta'} icon={editando ? 'pi pi-pencil' : 'pi pi-at'} onSave={salvar} loading={salvarMutation.isPending}>
        <div className={`form-field ${submitted && errors.nome ? 'field-error' : ''}`}>
          <label htmlFor="nome">Nome <span className="required">*</span></label>
          <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" placeholder="Ex: Conta principal" />
          {submitted && errors.nome && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.nome}</small>}
        </div>
        <div className="form-grid-2">
          <div className={`form-field ${submitted && errors.host ? 'field-error' : ''}`}>
            <label htmlFor="host">Servidor SMTP <span className="required">*</span></label>
            <InputText id="host" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="w-full" placeholder="smtp.gmail.com" />
            {submitted && errors.host && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.host}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="porta">Porta</label>
            <InputNumber id="porta" value={form.porta} onValueChange={(e) => setForm({ ...form, porta: e.value ?? null })} useGrouping={false} className="w-full" placeholder="587" />
          </div>
        </div>
        <div className={`form-field ${submitted && errors.usuario ? 'field-error' : ''}`}>
          <label htmlFor="usuario">Usuário / E-mail remetente <span className="required">*</span></label>
          <InputText id="usuario" type="email" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} className="w-full" placeholder="contato@empresa.com" autoComplete="off" />
          {submitted && errors.usuario && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.usuario}</small>}
        </div>
        <div className="form-field">
          <label htmlFor="remetenteNome">Nome do remetente</label>
          <InputText id="remetenteNome" value={form.remetenteNome} onChange={(e) => setForm({ ...form, remetenteNome: e.target.value })} className="w-full" placeholder="Hub Feat Creators" />
        </div>
        <div className="form-field">
          <label htmlFor="senha">Senha</label>
          <InputText id="senha" type="password" value={form.senha ?? ''} onChange={(e) => setForm({ ...form, senha: e.target.value })} className="w-full"
            placeholder={senhaConfigurada ? '•••••••••• (já configurada — preencha para alterar)' : 'Senha ou app password'} autoComplete="new-password" />
          <small className="config-hint">{senhaConfigurada ? 'Deixe em branco para manter a senha atual.' : 'Armazenada criptografada; nunca é exibida.'}</small>
        </div>
        <div className="form-grid-2">
          <div className="form-field switch-field">
            <InputSwitch id="tls" checked={form.tls} onChange={(e) => setForm({ ...form, tls: !!e.value })} />
            <label htmlFor="tls">Usar STARTTLS</label>
          </div>
          <div className="form-field switch-field">
            <InputSwitch id="sistema" checked={form.sistema} onChange={(e) => setForm({ ...form, sistema: !!e.value })} />
            <label htmlFor="sistema">Conta do sistema (padrão)</label>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </FormDialog>

      <Dialog header="Enviar e-mail de teste" visible={!!testeTarget} onHide={() => setTesteTarget(null)} style={{ width: '420px' }} modal>
        <div className="form-field">
          <label htmlFor="teste-destino">Destinatário</label>
          <InputText id="teste-destino" type="email" value={testeDestino} onChange={(e) => setTesteDestino(e.target.value)} className="w-full" placeholder="destinatario@email.com" autoFocus />
          <small className="config-hint">Envio pela conta "{testeTarget?.nome}".</small>
        </div>
        <div className="teste-actions">
          <Button label="Cancelar" className="p-button-text" onClick={() => setTesteTarget(null)} />
          <Button label="Enviar" icon="pi pi-send" onClick={() => testeMutation.mutate()} loading={testeMutation.isPending} disabled={!testeDestino.trim()} />
        </div>
      </Dialog>

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Registro" icon="pi pi-ban" message={`Deseja desativar a conta "${deactivateTarget?.nome}"?`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.nome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/contas-email" />

      <ImportacaoDialog visible={importVisible} onHide={() => setImportVisible(false)} onComplete={invalidate} />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-nome">Nome</label>
          <InputText id="filter-nome" value={filtros.nome ?? ''} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value || undefined })} placeholder="Filtrar por nome" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-usuario">Usuário</label>
          <InputText id="filter-usuario" value={filtros.usuario ?? ''} onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value || undefined })} placeholder="Filtrar por usuário" className="w-full" />
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

export default ContasEmail;
