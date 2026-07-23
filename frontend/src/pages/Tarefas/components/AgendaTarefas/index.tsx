import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { tarefaService, TarefaDTO, TarefaFiltros, dateToIso, estaAtrasada, responsavelNome, PRIORIDADE_LABEL, STATUS_TAREFA_LABEL } from '../../service';

type ModoAgenda = 'dia' | 'semana' | 'mes';

interface Props {
  filtros: TarefaFiltros;
  onEdit: (t: TarefaDTO) => void;
}

const MODO_OPTIONS = [
  { label: 'Dia', value: 'dia' },
  { label: 'Semana', value: 'semana' },
  { label: 'Mês', value: 'mes' },
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function addDias(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function inicioSemana(d: Date): Date {
  return addDias(d, -d.getDay());
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Intervalo visível [de, ate] conforme o modo (mês inclui as pontas das semanas). */
function intervalo(modo: ModoAgenda, base: Date): { de: Date; ate: Date } {
  if (modo === 'dia') return { de: base, ate: base };
  if (modo === 'semana') {
    const de = inicioSemana(base);
    return { de, ate: addDias(de, 6) };
  }
  const primeiro = new Date(base.getFullYear(), base.getMonth(), 1);
  const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { de: inicioSemana(primeiro), ate: addDias(inicioSemana(ultimo), 6) };
}

function navegar(modo: ModoAgenda, base: Date, direcao: 1 | -1): Date {
  if (modo === 'dia') return addDias(base, direcao);
  if (modo === 'semana') return addDias(base, 7 * direcao);
  return new Date(base.getFullYear(), base.getMonth() + direcao, 1);
}

function tituloPeriodo(modo: ModoAgenda, base: Date): string {
  if (modo === 'dia') return base.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  if (modo === 'semana') {
    const { de, ate } = intervalo('semana', base);
    return `${de.toLocaleDateString('pt-BR')} — ${ate.toLocaleDateString('pt-BR')}`;
  }
  return base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function AgendaTarefas({ filtros, onEdit }: Readonly<Props>) {
  const [modo, setModo] = useState<ModoAgenda>(() => (localStorage.getItem('tarefas:agendaModo') as ModoAgenda) || 'mes');
  const [dataBase, setDataBase] = useState<Date>(() => new Date());

  const trocarModo = (m: ModoAgenda) => {
    setModo(m);
    localStorage.setItem('tarefas:agendaModo', m);
  };

  const { de, ate } = intervalo(modo, dataBase);

  const agendaFiltros: TarefaFiltros = {
    ...filtros,
    previsaoDe: dateToIso(de) ?? undefined,
    previsaoAte: dateToIso(ate) ?? undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tarefas', 'agenda', agendaFiltros],
    queryFn: () => tarefaService.listar(0, 1000, agendaFiltros),
  });

  // Agrupa por previsão de término (tarefas sem previsão ficam fora da agenda).
  const porDia = useMemo(() => {
    const mapa = new Map<string, TarefaDTO[]>();
    (data?.content ?? []).forEach((t) => {
      if (!t.previsaoTermino) return;
      const lista = mapa.get(t.previsaoTermino) ?? [];
      lista.push(t);
      mapa.set(t.previsaoTermino, lista);
    });
    return mapa;
  }, [data]);

  const tarefasDoDia = (d: Date): TarefaDTO[] => porDia.get(dateToIso(d)!) ?? [];
  const hoje = new Date();

  const chip = (t: TarefaDTO, detalhado = false) => (
    <button
      key={t.id}
      type="button"
      className={`agenda-chip prio-${t.prioridade.toLowerCase()} ${t.status === 'CONCLUIDA' ? 'concluida' : ''} ${estaAtrasada(t) ? 'atrasada' : ''}`}
      onClick={() => onEdit(t)}
      title={`${t.titulo} — ${responsavelNome(t)} (${STATUS_TAREFA_LABEL[t.status]}, prioridade ${PRIORIDADE_LABEL[t.prioridade]})`}
    >
      {estaAtrasada(t) && <span className="agenda-chip-dot" />}
      <span className="agenda-chip-titulo">{t.titulo}</span>
      {detalhado && <span className="agenda-chip-resp">{responsavelNome(t)}</span>}
    </button>
  );

  const renderMes = () => {
    const dias: Date[] = [];
    for (let d = new Date(de); d <= ate; d = addDias(d, 1)) dias.push(new Date(d));
    const MAX_CHIPS = 3;
    return (
      <div className="agenda-mes">
        {DIAS_SEMANA.map((d) => <div key={d} className="agenda-mes-cabecalho">{d}</div>)}
        {dias.map((d) => {
          const doDia = tarefasDoDia(d);
          const foraDoMes = d.getMonth() !== dataBase.getMonth();
          return (
            <div key={d.toISOString()} className={`agenda-mes-celula ${foraDoMes ? 'fora-mes' : ''} ${mesmoDia(d, hoje) ? 'hoje' : ''}`}>
              <span className="agenda-mes-dia">{d.getDate()}</span>
              <div className="agenda-mes-chips">
                {doDia.slice(0, MAX_CHIPS).map((t) => chip(t))}
                {doDia.length > MAX_CHIPS && <span className="agenda-mais">+{doDia.length - MAX_CHIPS}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSemana = () => {
    const dias = Array.from({ length: 7 }, (_, i) => addDias(de, i));
    return (
      <div className="agenda-semana">
        {dias.map((d, i) => (
          <div key={d.toISOString()} className={`agenda-semana-coluna ${mesmoDia(d, hoje) ? 'hoje' : ''}`}>
            <div className="agenda-semana-cabecalho">
              <span>{DIAS_SEMANA[i]}</span>
              <span className="agenda-semana-data">{d.getDate()}/{d.getMonth() + 1}</span>
            </div>
            <div className="agenda-semana-corpo">
              {tarefasDoDia(d).map((t) => chip(t, true))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDia = () => {
    const doDia = tarefasDoDia(dataBase);
    return (
      <div className="agenda-dia">
        {doDia.length === 0 && <p className="agenda-vazio">Nenhuma tarefa com previsão de término neste dia.</p>}
        {doDia.map((t) => chip(t, true))}
      </div>
    );
  };

  return (
    <div className="agenda-tarefas">
      <div className="agenda-toolbar">
        <div className="agenda-nav">
          <Button icon="pi pi-chevron-left" className="btn-cancelar" onClick={() => setDataBase(navegar(modo, dataBase, -1))} />
          <Button label="Hoje" className="btn-cancelar" onClick={() => setDataBase(new Date())} />
          <Button icon="pi pi-chevron-right" className="btn-cancelar" onClick={() => setDataBase(navegar(modo, dataBase, 1))} />
          <span className="agenda-periodo">{tituloPeriodo(modo, dataBase)}</span>
        </div>
        <SelectButton value={modo} options={MODO_OPTIONS} onChange={(e) => { if (e.value) trocarModo(e.value); }} allowEmpty={false} />
      </div>

      {modo === 'mes' && renderMes()}
      {modo === 'semana' && renderSemana()}
      {modo === 'dia' && renderDia()}

      {isLoading && <p className="tarefas-loading">Carregando...</p>}
      <p className="agenda-hint">Tarefas sem previsão de término não aparecem na agenda.</p>
    </div>
  );
}

export default AgendaTarefas;
