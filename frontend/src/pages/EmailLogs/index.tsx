import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import PageHeader from '../../components/PageHeader';
import CrudHeader from '../../components/CrudHeader';
import FilterSidebar from '../../components/FilterSidebar';
import { emailLogService, LogEmailDTO, LogEmailFiltros, STATUS_EMAIL_OPTIONS } from './service';
import './styles.scss';

const SEVERITY: Record<string, 'success' | 'danger' | 'warning'> = {
  SUCESSO: 'success',
  FALHA: 'danger',
  CANCELADO: 'warning',
};

function EmailLogs() {
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filtros, setFiltros] = useState<LogEmailFiltros>({ status: [] });
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryFiltros: LogEmailFiltros = { ...filtros, textoDeBusca: debouncedBusca || undefined };

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['email-logs', currentPage, pageSize, queryFiltros],
    queryFn: () => emailLogService.listar(currentPage, pageSize, queryFiltros),
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedBusca(filtroGlobal); setCurrentPage(0); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtroGlobal]);

  const formatDate = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  const dataTemplate = (row: LogEmailDTO) =>
    row.registro ? new Date(row.registro).toLocaleString('pt-BR') : <span className="text-muted">&mdash;</span>;

  const destinatariosTemplate = (row: LogEmailDTO) =>
    row.destinatarios || <span className="text-muted">&mdash;</span>;

  const contaTemplate = (row: LogEmailDTO) =>
    row.conta || <span className="text-muted">&mdash;</span>;

  const statusTemplate = (row: LogEmailDTO) => (
    <Tag value={row.status} severity={SEVERITY[row.status] ?? 'info'} />
  );

  const erroTemplate = (row: LogEmailDTO) =>
    row.erro ? (
      <>
        <Tooltip target={`#erro-${row.id}`} position="top" />
        <span id={`erro-${row.id}`} className="email-erro" data-pr-tooltip={row.erro}>{row.erro}</span>
      </>
    ) : (
      <span className="text-muted">&mdash;</span>
    );

  const temFiltroAtivo = !!filtros.status?.length || !!filtros.titulo || !!filtros.destinatario || !!filtros.criadoPor || !!filtros.registroDe || !!filtros.registroAte;

  return (
    <div className="crud-page">
      <PageHeader title="Logs de E-mail" subtitle="Rastreabilidade dos envios" />

      <div className="content-card">
        <DataTable
          value={paginatedData?.content ?? []} loading={isLoading} lazy
          totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
          onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
          header={
            <CrudHeader searchValue={filtroGlobal} onSearchChange={setFiltroGlobal} searchPlaceholder="Buscar por título..."
              onFilterClick={() => setFilterVisible(true)} showNew={false}
            />
          }
          paginator rowsPerPageOptions={[5, 10, 25]} emptyMessage="Nenhum envio registrado" stripedRows
        >
          <Column field="registro" header="Data" body={dataTemplate} style={{ width: '180px' }} />
          <Column field="titulo" header="Título" />
          <Column field="destinatarios" header="Destinatários" body={destinatariosTemplate} />
          <Column field="conta" header="Conta" body={contaTemplate} style={{ width: '150px' }} />
          <Column field="status" header="Status" body={statusTemplate} style={{ width: '120px' }} />
          <Column field="erro" header="Erro" body={erroTemplate} />
          <Column field="criadoPor" header="Enviado por" style={{ width: '180px' }} />
        </DataTable>
      </div>

      <FilterSidebar visible={filterVisible} onHide={() => setFilterVisible(false)} onClear={() => { setFiltros({ status: [] }); setCurrentPage(0); }} clearDisabled={!temFiltroAtivo}>
        <div className="form-field">
          <label htmlFor="filter-titulo">Título</label>
          <InputText id="filter-titulo" value={filtros.titulo ?? ''} onChange={(e) => setFiltros({ ...filtros, titulo: e.target.value || undefined })} placeholder="Filtrar por título" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-destinatario">Destinatário</label>
          <InputText id="filter-destinatario" value={filtros.destinatario ?? ''} onChange={(e) => setFiltros({ ...filtros, destinatario: e.target.value || undefined })} placeholder="Filtrar por destinatário" className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-status">Status</label>
          <MultiSelect id="filter-status" value={filtros.status} options={STATUS_EMAIL_OPTIONS} onChange={(e) => setFiltros({ ...filtros, status: e.value })} placeholder="Todos" className="w-full" display="chip" />
        </div>
        <div className="form-field">
          <label htmlFor="filter-criado">Enviado por</label>
          <InputText id="filter-criado" value={filtros.criadoPor ?? ''} onChange={(e) => setFiltros({ ...filtros, criadoPor: e.target.value || undefined })} placeholder="E-mail do usuário" className="w-full" />
        </div>
        <div className="filter-date-group">
          <label>Data de envio</label>
          <div className="filter-date-range">
            <Calendar value={filtros.registroDe ? new Date(filtros.registroDe + 'T00:00:00') : null} onChange={(e) => setFiltros({ ...filtros, registroDe: formatDate(e.value as Date) })} placeholder="De" dateFormat="dd/mm/yy" showIcon className="w-full" />
            <Calendar value={filtros.registroAte ? new Date(filtros.registroAte + 'T00:00:00') : null} onChange={(e) => setFiltros({ ...filtros, registroAte: formatDate(e.value as Date) })} placeholder="Até" dateFormat="dd/mm/yy" showIcon className="w-full" />
          </div>
        </div>
      </FilterSidebar>
    </div>
  );
}

export default EmailLogs;
