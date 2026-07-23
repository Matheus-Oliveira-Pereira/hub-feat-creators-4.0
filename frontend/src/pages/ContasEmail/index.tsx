import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
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
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import ImportacaoDialog from './components/ImportacaoDialog';
import ContaEmailFormDialog from './components/ContaEmailFormDialog';
import { contaEmailService, ContaEmailDTO, ContaEmailFiltros } from './service';
import './styles.scss';

function ContasEmail() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { user: authUser } = useAuth();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [copyFromId, setCopyFromId] = useState<string | null>(null);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<ContaEmailFiltros>({ status: [] });
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

  const abrirNovo = () => { setEditId(null); setCopyFromId(null); setDialogVisible(true); };
  const abrirEdicao = (row: ContaEmailDTO) => { setEditId(row.id); setCopyFromId(null); setDialogVisible(true); };
  const abrirCopia = (row: ContaEmailDTO) => { setCopyFromId(row.id); setEditId(null); setDialogVisible(true); };

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
        onCopy={() => abrirCopia(row)}
        onDeactivate={() => setDeactivateTarget(row)}
        onRestore={() => restaurarMutation.mutate(row.id)}
        onDelete={() => setDeleteTarget(row)}
        showHistory
        showEdit={podeEditar && row.status === 'ATIVO'}
        showCopy={podeAdicionar && row.status === 'ATIVO'}
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

      <ContaEmailFormDialog visible={dialogVisible} onHide={() => setDialogVisible(false)} editId={editId} copyFromId={copyFromId} />

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
