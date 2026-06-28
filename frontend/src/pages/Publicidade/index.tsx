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
import PublicidadeDialog from './components/PublicidadeDialog';
import {
  publicidadeService,
  PublicidadeDTO,
  PublicidadeFiltros,
  Publicidade as PublicidadeEntity,
  StatusFinanceiro,
  STATUS_FINANCEIRO_LABEL,
} from './service';
import './styles.scss';

const STATUS_FIN_OPTIONS = (Object.keys(STATUS_FINANCEIRO_LABEL) as StatusFinanceiro[])
  .map((s) => ({ label: STATUS_FINANCEIRO_LABEL[s], value: s }));

function formatarValor(v: number | null): string {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Publicidade() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { subscribe } = useNotificacoes();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const podeAdicionar = canAdd(roles, MODULES.PUBLICIDADE.prefix);
  const podeEditar = canChange(roles, MODULES.PUBLICIDADE.prefix);
  const podeExcluir = canDelete(roles, MODULES.PUBLICIDADE.prefix);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editando, setEditando] = useState<PublicidadeEntity | null>(null);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<PublicidadeFiltros>({ statusFinanceiro: [] });
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<PublicidadeDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublicidadeDTO | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: PublicidadeFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined, mostrarInativos };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['publicidades', currentPage, pageSize, queryFiltros],
    queryFn: () => publicidadeService.listar(currentPage, pageSize, queryFiltros),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['publicidades'] });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => publicidadeService.desativar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Publicidade desativada' }); setDeactivateTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao desativar' }),
  });
  const restaurarMutation = useMutation({
    mutationFn: (id: string) => publicidadeService.restaurar(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Publicidade restaurada' }); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao restaurar' }),
  });
  const excluirMutation = useMutation({
    mutationFn: (id: string) => publicidadeService.excluir(id),
    onSuccess: () => { toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Publicidade excluída' }); setDeleteTarget(null); invalidate(); },
    onError: () => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir' }),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  useEffect(() => {
    const unsub = subscribe((n) => { if (n.entidade === 'Publicidade') invalidate(); });
    return unsub;
  }, [subscribe]);

  const showToast = (severity: 'success' | 'error' | 'warn', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'success' ? 'Sucesso' : 'Atenção', detail });

  const abrirNovo = () => { setEditando(null); setDialogVisible(true); };
  const abrirEdicao = async (row: PublicidadeDTO) => {
    try {
      const full = await publicidadeService.buscar(row.id);
      setEditando(full);
      setDialogVisible(true);
    } catch {
      showToast('error', 'Erro ao carregar publicidade');
    }
  };

  const statusFinTemplate = (row: PublicidadeDTO) => {
    if (!row.statusFinanceiro) return <span className="qtd-badge">—</span>;
    const atrasado = row.statusFinanceiro === 'PAGAMENTO_ATRASADO';
    return <span className={`fin-badge ${atrasado ? 'fin-atrasado' : ''}`}>{STATUS_FINANCEIRO_LABEL[row.statusFinanceiro]}</span>;
  };
  const ativoTemplate = (row: PublicidadeDTO) => <StatusBadge status={row.ativo ? 'ATIVO' : 'INATIVO'} />;
  const valorTemplate = (row: PublicidadeDTO) => formatarValor(row.valorTotal);
  const entregaveisTemplate = (row: PublicidadeDTO) => <span className="qtd-badge">{row.qtdEntregaveis} entreg.</span>;

  const acoesTemplate = (row: PublicidadeDTO) => (
    <TableActions
      onHistory={() => { setHistoryId(row.id); setHistoryVisible(true); }}
      onEdit={() => abrirEdicao(row)}
      onDeactivate={() => setDeactivateTarget(row)}
      onRestore={() => restaurarMutation.mutate(row.id)}
      onDelete={() => setDeleteTarget(row)}
      showHistory
      showEdit={podeEditar && row.ativo}
      showDeactivate={podeExcluir && row.ativo}
      showRestore={!row.ativo}
      showDelete={podeExcluir && !row.ativo}
    />
  );

  const temFiltroAtivo = !!filtros.statusFinanceiro?.length || !!filtros.marca || !!filtros.parceiro;

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Publicidade" subtitle={mostrarInativos ? 'Registros desativados' : 'Contratos de publicidade fechados'} />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por marca ou influenciador..."
              onFilterClick={() => setFilterVisible(true)} newLabel="Nova Publicidade" onNewClick={abrirNovo} showNew={podeAdicionar}
              showInactive onToggleInactive={(v) => { setMostrarInativos(v); setCurrentPage(0); }} inactiveActive={mostrarInativos}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhuma publicidade encontrada'} stripedRows removableSort
        >
          <Column field="marcaNome" header="Marca" sortable />
          <Column field="influenciadorNome" header="Influenciador" sortable />
          <Column field="parceiro" header="Parceiro" body={(r: PublicidadeDTO) => r.parceiro || '—'} />
          <Column header="Entregáveis" body={entregaveisTemplate} style={{ width: '120px' }} />
          <Column header="Financeiro" body={statusFinTemplate} style={{ width: '160px' }} />
          <Column header="Valor" body={valorTemplate} style={{ width: '130px' }} />
          <Column header="Ativo" body={ativoTemplate} style={{ width: '110px' }} />
          <Column header="Ações" body={acoesTemplate} style={{ width: '160px' }} />
        </DataTable>
      </div>

      <PublicidadeDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        onSaved={invalidate}
        onToast={showToast}
        inicial={null}
        editando={editando}
      />

      <ConfirmDialog visible={!!deactivateTarget} onHide={() => setDeactivateTarget(null)} onConfirm={() => deactivateTarget && desativarMutation.mutate(deactivateTarget.id)}
        title="Desativar Publicidade" icon="pi pi-ban" message={`Deseja desativar a publicidade de "${deactivateTarget?.marcaNome}"?`}
        confirmLabel="Desativar" confirmIcon="pi pi-ban" confirmSeverity="warning" className="deactivate-dialog" />

      <DeleteDialog visible={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && excluirMutation.mutate(deleteTarget.id)}
        loading={excluirMutation.isPending} entityName={deleteTarget?.marcaNome} />

      <HistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} entityId={historyId} servicePath="/publicidades" />

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ statusFinanceiro: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-marca">Marca</label>
          <InputText id="filter-marca" value={filtros.marca ?? ''} onChange={(e) => setFiltros({ ...filtros, marca: e.target.value || undefined })} placeholder="Filtrar por marca" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-parceiro">Parceiro</label>
          <InputText id="filter-parceiro" value={filtros.parceiro ?? ''} onChange={(e) => setFiltros({ ...filtros, parceiro: e.target.value || undefined })} placeholder="Filtrar por parceiro" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-fin">Status financeiro</label>
          <MultiSelect id="filter-fin" value={filtros.statusFinanceiro} options={STATUS_FIN_OPTIONS} onChange={(e) => setFiltros({ ...filtros, statusFinanceiro: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
      </FilterSidebar>
    </div>
  );
}

export default Publicidade;
