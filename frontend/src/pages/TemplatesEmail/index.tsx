import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/PageHeader';
import CrudHeader from '../../components/CrudHeader';
import StatusBadge from '../../components/StatusBadge';
import TableActions from '../../components/TableActions';
import HistoryDialog from '../../components/HistoryDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeleteDialog from '../../components/DeleteDialog';
import FilterSidebar from '../../components/FilterSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../contexts/WebSocketContext';
import { canAdd, canChange, canDelete, MODULES } from '../../utils/roles';
import TemplateDialog from './components/TemplateDialog';
import {
  templateEmailService,
  TemplateEmailDTO,
  TemplateEmailFiltros,
  TemplateEmail,
  TipoTemplateEmail,
  TIPO_TEMPLATE_LABEL,
} from './service';
import './styles.scss';

const TIPO_OPTIONS = (Object.keys(TIPO_TEMPLATE_LABEL) as TipoTemplateEmail[])
  .map((t) => ({ label: TIPO_TEMPLATE_LABEL[t], value: t }));

function TemplatesEmail() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.TEMPLATES_EMAIL.prefix);
  const podeEditar = canChange(roles, MODULES.TEMPLATES_EMAIL.prefix);
  const podeExcluir = canDelete(roles, MODULES.TEMPLATES_EMAIL.prefix);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState<TemplateEmail | null>(null);
  const [copiando, setCopiando] = useState(false);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<TemplateEmailFiltros>({ tipo: [], status: [] });
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TemplateEmailDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateEmailDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: TemplateEmailFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['templates-email', currentPage, pageSize, queryFiltros],
    queryFn: () => templateEmailService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['templates-email'] });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => templateEmailService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Template desativado' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });
  const restaurarMutation = useMutation({
    mutationFn: (id: string) => templateEmailService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Template restaurado' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });
  const excluirMutation = useMutation({
    mutationFn: (id: string) => templateEmailService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Template excluído' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'TemplateEmail') invalidate(); });
    return unsub;
  }, [subscribe]);

  const showToast = (severity: 'success' | 'error' | 'warn', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : 'Atenção', detail });

  const abrirNovo = () => { setEditando(null); setCopiando(false); setDialogVisible(true); };
  const abrirEdicao = async (row: TemplateEmailDTO) => {
    try {
      const full = await templateEmailService.buscar(row.id);
      setEditando(full);
      setCopiando(false);
      setDialogVisible(true);
    } catch {
      showToast('error', 'Erro ao carregar template');
    }
  };
  // Copia um template como novo: a descrição (nome) fica em branco para forçar troca.
  const abrirCopia = async (row: TemplateEmailDTO) => {
    try {
      const full = await templateEmailService.buscar(row.id);
      setEditando(full);
      setCopiando(true);
      setDialogVisible(true);
    } catch {
      showToast('error', 'Erro ao carregar template');
    }
  };

  const tipoTemplate = (row: TemplateEmailDTO) => (
    <span className={`tipo-tpl-badge tipo-${row.tipo.toLowerCase()}`}>{TIPO_TEMPLATE_LABEL[row.tipo]}</span>
  );
  const padraoTemplate = (row: TemplateEmailDTO) => row.padrao
    ? <span className="padrao-badge"><i className="pi pi-star-fill" /> Padrão</span>
    : <span className="qtd-badge">—</span>;
  const statusTemplate = (row: TemplateEmailDTO) => <StatusBadge status={row.status} />;

  const acoesTemplate = (row: TemplateEmailDTO) => (
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
  );

  const temFiltroAtivo = !!filtros.tipo?.length || !!filtros.status?.length || !!filtros.nome;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Templates de E-mail" subtitle={mostrarInativos ? 'Registros desativados' : 'Modelos de e-mail de prospecção e follow-up'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por nome ou assunto..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Novo Template" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhum template encontrado'} stripedRows removableSort
        >
          <Column field="nome" header="Nome" sortable />
          <Column header="Tipo" body={tipoTemplate} style={{ width: '140px' }} />
          <Column field="assunto" header="Assunto" />
          <Column header="Padrão" body={padraoTemplate} style={{ width: '110px' }} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '160px' }} />
        </DataTable>
      </div>

      <TemplateDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        onSaved={invalidate}
        onToast={showToast}
        editando={editando}
        copiando={copiando}
      />

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Template" icon="pi pi-ban" message={`Deseja desativar o template "${deactivateTarget?.nome}"?`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.nome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/templates-email" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ tipo: [], status: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-nome">Nome</label>
          <InputText id="filter-nome" value={filtros.nome ?? ''} onChange={(e) => setFiltros({ ...filtros, nome: e.target.value || undefined })} placeholder="Filtrar por nome" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-tipo">Tipo</label>
          <MultiSelect id="filter-tipo" value={filtros.tipo} options={TIPO_OPTIONS} onChange={(e) => setFiltros({ ...filtros, tipo: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
      </FilterSidebar>
    </div>
  );
}

export default TemplatesEmail;
