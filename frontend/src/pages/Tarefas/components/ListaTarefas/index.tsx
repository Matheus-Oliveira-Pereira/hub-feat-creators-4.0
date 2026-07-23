import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import StatusBadge from '../../../../components/StatusBadge';
import TableActions from '../../../../components/TableActions';
import {
  tarefaService,
  TarefaDTO,
  TarefaFiltros,
  STATUS_TAREFA_LABEL,
  PRIORIDADE_LABEL,
  RECORRENCIA_LABEL,
  estaAtrasada,
  formatarData,
  responsavelNome,
} from '../../service';

interface Props {
  filtros: TarefaFiltros;
  mostrarInativos: boolean;
  podeEditar: boolean;
  podeExcluir: boolean;
  header: React.ReactNode;
  onEdit: (t: TarefaDTO) => void;
  onEmail: (t: TarefaDTO) => void;
  onHistory: (t: TarefaDTO) => void;
  onDeactivate: (t: TarefaDTO) => void;
  onRestore: (t: TarefaDTO) => void;
  onDelete: (t: TarefaDTO) => void;
}

function ListaTarefas({ filtros, mostrarInativos, podeEditar, podeExcluir, header, onEdit, onEmail, onHistory, onDeactivate, onRestore, onDelete }: Readonly<Props>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['tarefas', 'lista', currentPage, pageSize, filtros],
    queryFn: () => tarefaService.listar(currentPage, pageSize, filtros),
  });

  const statusTemplate = (row: TarefaDTO) => (
    <span className={`tarefa-status-badge st-${row.status.toLowerCase()}`}>{STATUS_TAREFA_LABEL[row.status]}</span>
  );
  const prioridadeTemplate = (row: TarefaDTO) => (
    <span className={`prioridade-badge prio-${row.prioridade.toLowerCase()}`}>{PRIORIDADE_LABEL[row.prioridade]}</span>
  );
  const previsaoTemplate = (row: TarefaDTO) => (
    <span className={estaAtrasada(row) ? 'previsao-atrasada' : ''}>
      {estaAtrasada(row) && <i className="pi pi-exclamation-triangle" style={{ marginRight: '0.3rem' }} />}
      {formatarData(row.previsaoTermino)}
    </span>
  );
  const checklistTemplate = (row: TarefaDTO) =>
    row.totalChecklist > 0 ? <span className="qtd-badge">{row.checklistConcluidos}/{row.totalChecklist}</span> : '—';
  const ativoTemplate = (row: TarefaDTO) => <StatusBadge status={row.ativo ? 'ATIVO' : 'INATIVO'} />;

  const acoesTemplate = (row: TarefaDTO) => (
    <div className="tarefa-acoes">
      <button type="button" className="acao-email" onClick={() => onEmail(row)} title="Enviar e-mail ao responsável">
        <i className="pi pi-send" />
      </button>
      <TableActions
        onHistory={() => onHistory(row)}
        onEdit={() => onEdit(row)}
        onDeactivate={() => onDeactivate(row)}
        onRestore={() => onRestore(row)}
        onDelete={() => onDelete(row)}
        showHistory
        showEdit={podeEditar && row.ativo}
        showDeactivate={podeExcluir && row.ativo}
        showRestore={!row.ativo}
        showDelete={podeExcluir && !row.ativo}
      />
    </div>
  );

  return (
    <DataTable
      value={paginatedData?.content ?? []} loading={isLoading} lazy
      totalRecords={paginatedData?.totalElements ?? 0} first={currentPage * pageSize} rows={pageSize}
      onPage={(e: DataTablePageEvent) => { setCurrentPage(e.page ?? 0); setPageSize(e.rows); }}
      header={header}
      rowClassName={(row: TarefaDTO) => (estaAtrasada(row) ? 'tarefa-linha-atrasada' : '')}
      paginator rowsPerPageOptions={[5, 10, 25]}
      emptyMessage={mostrarInativos ? 'Nenhum registro desativado' : 'Nenhuma tarefa encontrada'}
      stripedRows removableSort
    >
      <Column field="titulo" header="Título" sortable body={(r: TarefaDTO) => (
        <span className="tarefa-titulo-cell">
          {r.titulo}
          {r.recorrencia && (
            <i className="pi pi-replay tarefa-recorrente-icone" title={`Recorrente — ${RECORRENCIA_LABEL[r.recorrencia]}`} />
          )}
        </span>
      )} />
      <Column header="Responsável" body={(r: TarefaDTO) => responsavelNome(r)} />
      <Column field="influenciadorNome" header="Influenciador" body={(r: TarefaDTO) => r.influenciadorNome ?? '—'} />
      <Column field="marcaNome" header="Marca" body={(r: TarefaDTO) => r.marcaNome ?? '—'} />
      <Column header="Prioridade" body={prioridadeTemplate} style={{ width: '110px' }} />
      <Column header="Status" body={statusTemplate} style={{ width: '130px' }} />
      <Column header="Previsão" body={previsaoTemplate} style={{ width: '130px' }} />
      <Column header="Checklist" body={checklistTemplate} style={{ width: '100px' }} />
      <Column header="Ativo" body={ativoTemplate} style={{ width: '100px' }} />
      <Column header="Ações" body={acoesTemplate} style={{ width: '190px' }} />
    </DataTable>
  );
}

export default ListaTarefas;
