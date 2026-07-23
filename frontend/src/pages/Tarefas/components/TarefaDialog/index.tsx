import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';
import { Calendar } from 'primereact/calendar';
import FormDialog from '../../../../components/FormDialog';
import ChecklistEditor from '../ChecklistEditor';
import {
  tarefaService,
  Tarefa,
  TarefaForm,
  TarefaInicial,
  StatusTarefa,
  PrioridadeTarefa,
  TipoResponsavelTarefa,
  TipoLembreteTarefa,
  TipoRecorrenciaTarefa,
  ChecklistItem,
  STATUS_TAREFA_LABEL,
  PRIORIDADE_LABEL,
  TIPO_RESPONSAVEL_LABEL,
  LEMBRETE_LABEL,
  RECORRENCIA_LABEL,
  isoToDate,
  dateToIso,
  formatarData,
} from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  editando: Tarefa | null;
  inicial: TarefaInicial | null;
}

const STATUS_OPTIONS = (Object.keys(STATUS_TAREFA_LABEL) as StatusTarefa[])
  .map((s) => ({ label: STATUS_TAREFA_LABEL[s], value: s }));
const PRIORIDADE_OPTIONS = (Object.keys(PRIORIDADE_LABEL) as PrioridadeTarefa[])
  .map((p) => ({ label: PRIORIDADE_LABEL[p], value: p }));
const TIPO_RESPONSAVEL_OPTIONS = (Object.keys(TIPO_RESPONSAVEL_LABEL) as TipoResponsavelTarefa[])
  .map((t) => ({ label: TIPO_RESPONSAVEL_LABEL[t], value: t }));
const LEMBRETE_OPTIONS = (Object.keys(LEMBRETE_LABEL) as TipoLembreteTarefa[])
  .map((l) => ({ label: LEMBRETE_LABEL[l], value: l }));
const RECORRENCIA_OPTIONS = (Object.keys(RECORRENCIA_LABEL) as TipoRecorrenciaTarefa[])
  .map((r) => ({ label: RECORRENCIA_LABEL[r], value: r }));

function TarefaDialog({ visible, onHide, onSaved, onToast, editando, inicial }: Readonly<Props>) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<StatusTarefa>('A_FAZER');
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('MEDIA');
  const [tipoResponsavel, setTipoResponsavel] = useState<TipoResponsavelTarefa>('ASSESSORA');
  const [usuarioResponsavelId, setUsuarioResponsavelId] = useState<string | null>(null);
  const [influResponsavelId, setInfluResponsavelId] = useState<string | null>(null);
  const [influenciadorId, setInfluenciadorId] = useState<string | null>(null);
  const [marcaId, setMarcaId] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState<string | null>(null);
  const [previsaoExecucao, setPrevisaoExecucao] = useState<string | null>(null);
  const [dataExecucao, setDataExecucao] = useState<string | null>(null);
  const [previsaoTermino, setPrevisaoTermino] = useState<string | null>(null);
  const [notificacaoAutomatica, setNotificacaoAutomatica] = useState(false);
  const [lembretes, setLembretes] = useState<TipoLembreteTarefa[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [recorrencia, setRecorrencia] = useState<TipoRecorrenciaTarefa | null>(null);
  const [recorrenciaFim, setRecorrenciaFim] = useState<string | null>(null);
  const [recorrenciaMax, setRecorrenciaMax] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: usuarios = [] } = useQuery({
    queryKey: ['tarefas-usuarios-ativos'],
    queryFn: tarefaService.listarUsuariosAtivos,
    enabled: visible,
  });
  const { data: influenciadores = [] } = useQuery({
    queryKey: ['tarefas-influenciadores-ativos'],
    queryFn: tarefaService.listarInfluenciadoresAtivos,
    enabled: visible,
  });
  const { data: marcas = [] } = useQuery({
    queryKey: ['tarefas-marcas-ativas'],
    queryFn: tarefaService.listarMarcasAtivas,
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    if (editando) {
      setTitulo(editando.titulo);
      setDescricao(editando.descricao ?? '');
      setObservacoes(editando.observacoes ?? '');
      setStatus(editando.status);
      setPrioridade(editando.prioridade);
      setTipoResponsavel(editando.tipoResponsavel);
      setUsuarioResponsavelId(editando.usuarioResponsavel?.id ?? null);
      setInfluResponsavelId(editando.influenciadorResponsavel?.id ?? null);
      setInfluenciadorId(editando.influenciador?.id ?? null);
      setMarcaId(editando.marca?.id ?? null);
      setDataInicio(editando.dataInicio);
      setPrevisaoExecucao(editando.previsaoExecucao);
      setDataExecucao(editando.dataExecucao);
      setPrevisaoTermino(editando.previsaoTermino);
      setNotificacaoAutomatica(editando.notificacaoAutomatica);
      setLembretes(editando.lembretes ?? []);
      setChecklist(editando.checklist ?? []);
      setRecorrencia(editando.recorrencia ?? null);
      setRecorrenciaFim(editando.recorrenciaFim ?? null);
      setRecorrenciaMax(editando.recorrenciaMaxOcorrencias ?? null);
    } else {
      setTitulo('');
      setDescricao(inicial?.descricao ?? '');
      setObservacoes('');
      setStatus('A_FAZER');
      setPrioridade('MEDIA');
      setTipoResponsavel('ASSESSORA');
      setUsuarioResponsavelId(null);
      setInfluResponsavelId(null);
      setInfluenciadorId(inicial?.influenciador?.id ?? null);
      setMarcaId(inicial?.marca?.id ?? null);
      setDataInicio(null);
      setPrevisaoExecucao(null);
      setDataExecucao(null);
      setPrevisaoTermino(null);
      setNotificacaoAutomatica(false);
      setLembretes([]);
      setChecklist([]);
      setRecorrencia(null);
      setRecorrenciaFim(null);
      setRecorrenciaMax(null);
    }
  }, [visible, editando, inicial]);

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: TarefaForm = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        observacoes: observacoes.trim() || null,
        status,
        prioridade,
        tipoResponsavel,
        usuarioResponsavel: tipoResponsavel === 'ASSESSORA' && usuarioResponsavelId ? { id: usuarioResponsavelId } : null,
        influenciadorResponsavel: tipoResponsavel === 'INFLUENCIADOR' && influResponsavelId ? { id: influResponsavelId } : null,
        influenciador: influenciadorId ? { id: influenciadorId } : null,
        marca: marcaId ? { id: marcaId } : null,
        publicidade: editando?.publicidade ?? (inicial?.publicidadeId ? { id: inicial.publicidadeId } : null),
        prospecao: editando?.prospecao ?? (inicial?.prospecaoId ? { id: inicial.prospecaoId } : null),
        dataInicio,
        previsaoExecucao,
        dataExecucao,
        previsaoTermino,
        notificacaoAutomatica,
        lembretes,
        checklist: checklist.filter((c) => c.descricao.trim().length > 0),
        recorrencia,
        recorrenciaFim: recorrencia ? recorrenciaFim : null,
        recorrenciaMaxOcorrencias: recorrencia ? recorrenciaMax : null,
      };
      return editando ? tarefaService.atualizar(editando.id, payload) : tarefaService.salvar(payload);
    },
    onSuccess: () => {
      onToast('success', editando ? 'Tarefa atualizada' : 'Tarefa criada');
      onSaved();
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao salvar tarefa');
    },
  });

  const responsavelOk = tipoResponsavel === 'ASSESSORA' ? !!usuarioResponsavelId : !!influResponsavelId;

  const salvar = () => {
    setSubmitted(true);
    if (!titulo.trim()) {
      onToast('warn', 'Informe o título da tarefa.');
      return;
    }
    if (!responsavelOk) {
      onToast('warn', tipoResponsavel === 'ASSESSORA'
        ? 'Informe o usuário responsável.'
        : 'Informe o influenciador responsável.');
      return;
    }
    if (recorrencia && !previsaoTermino) {
      onToast('warn', 'Tarefa recorrente exige previsão de término.');
      return;
    }
    salvarMutation.mutate();
  };

  const campoData = (id: string, label: string, value: string | null, onChange: (v: string | null) => void) => (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <Calendar id={id} value={isoToDate(value)} onChange={(e) => onChange(dateToIso(e.value as Date | null))}
        dateFormat="dd/mm/yy" showIcon showButtonBar className="w-full" baseZIndex={10000} />
    </div>
  );

  return (
    <FormDialog
      visible={visible}
      onHide={onHide}
      title={editando ? 'Editar Tarefa' : 'Nova Tarefa'}
      icon="pi pi-check-square"
      onSave={salvar}
      loading={salvarMutation.isPending}
      width="760px"
      className="tarefa-dialog"
    >
      <div className="form-field">
        <label htmlFor="tf-titulo">Título *</label>
        <InputText id="tf-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)}
          className={`w-full ${submitted && !titulo.trim() ? 'p-invalid' : ''}`} autoFocus />
      </div>

      <div className="form-field">
        <label htmlFor="tf-descricao">Descrição</label>
        <InputTextarea id="tf-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)}
          rows={3} className="w-full" autoResize />
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <label>Responsável *</label>
          <SelectButton value={tipoResponsavel} options={TIPO_RESPONSAVEL_OPTIONS}
            onChange={(e) => { if (e.value) setTipoResponsavel(e.value); }} allowEmpty={false} />
        </div>
        <div className="form-field">
          <label htmlFor="tf-responsavel">{tipoResponsavel === 'ASSESSORA' ? 'Usuário responsável *' : 'Influenciador responsável *'}</label>
          {tipoResponsavel === 'ASSESSORA' ? (
            <Dropdown id="tf-responsavel" value={usuarioResponsavelId}
              options={usuarios.map((u) => ({ label: u.nome, value: u.id }))}
              onChange={(e) => setUsuarioResponsavelId(e.value)} placeholder="Selecione" filter
              className={`w-full ${submitted && !responsavelOk ? 'p-invalid' : ''}`} baseZIndex={10000} />
          ) : (
            <Dropdown id="tf-responsavel" value={influResponsavelId}
              options={influenciadores.map((i) => ({ label: i.nome, value: i.id }))}
              onChange={(e) => setInfluResponsavelId(e.value)} placeholder="Selecione" filter
              className={`w-full ${submitted && !responsavelOk ? 'p-invalid' : ''}`} baseZIndex={10000} />
          )}
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <label htmlFor="tf-influ">Influenciador vinculado</label>
          <Dropdown id="tf-influ" value={influenciadorId}
            options={influenciadores.map((i) => ({ label: i.nome, value: i.id }))}
            onChange={(e) => setInfluenciadorId(e.value)} placeholder="Nenhum" filter showClear
            className="w-full" baseZIndex={10000} />
        </div>
        <div className="form-field">
          <label htmlFor="tf-marca">Marca vinculada</label>
          <Dropdown id="tf-marca" value={marcaId}
            options={marcas.map((m) => ({ label: m.nome, value: m.id }))}
            onChange={(e) => setMarcaId(e.value)} placeholder="Nenhuma" filter showClear
            className="w-full" baseZIndex={10000} />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <label htmlFor="tf-prioridade">Prioridade</label>
          <Dropdown id="tf-prioridade" value={prioridade} options={PRIORIDADE_OPTIONS}
            onChange={(e) => setPrioridade(e.value)} className="w-full" baseZIndex={10000} />
        </div>
        {editando && (
          <div className="form-field">
            <label htmlFor="tf-status">Status</label>
            <Dropdown id="tf-status" value={status} options={STATUS_OPTIONS}
              onChange={(e) => setStatus(e.value)} className="w-full" baseZIndex={10000} />
          </div>
        )}
      </div>

      <div className="form-grid-2">
        {campoData('tf-inicio', 'Data de início', dataInicio, setDataInicio)}
        {campoData('tf-prev-exec', 'Previsão de execução', previsaoExecucao, setPrevisaoExecucao)}
      </div>
      <div className="form-grid-2">
        {campoData('tf-exec', 'Data de execução', dataExecucao, setDataExecucao)}
        {campoData('tf-prev-termino', 'Previsão de término', previsaoTermino, setPrevisaoTermino)}
      </div>

      {editando?.dataConclusao && (
        <p className="tarefa-conclusao-info">
          <i className="pi pi-check-circle" /> Concluída em {formatarData(editando.dataConclusao)}
        </p>
      )}

      <div className="tarefa-recorrencia">
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="tf-recorrencia">
              Repetir
              {editando && editando.recorrenciaOcorrencia > 1 && (
                <span className="recorrencia-ocorrencia"> — ocorrência nº {editando.recorrenciaOcorrencia}</span>
              )}
            </label>
            <Dropdown id="tf-recorrencia" value={recorrencia} options={RECORRENCIA_OPTIONS}
              onChange={(e) => setRecorrencia(e.value ?? null)} placeholder="Não repete" showClear
              className="w-full" baseZIndex={10000} />
          </div>
          {recorrencia && campoData('tf-recorrencia-fim', 'Repetir até (opcional)', recorrenciaFim, setRecorrenciaFim)}
        </div>
        {recorrencia && (
          <>
            <div className="form-field">
              <label htmlFor="tf-recorrencia-max">Máx. de ocorrências (opcional)</label>
              <InputNumber id="tf-recorrencia-max" value={recorrenciaMax}
                onValueChange={(e) => setRecorrenciaMax(e.value ?? null)} min={1} showButtons
                placeholder="Sem limite" className="w-full" />
            </div>
            <small className="recorrencia-hint">
              <i className="pi pi-replay" /> A próxima ocorrência é criada ao concluir esta tarefa. Cancelar encerra a série.
            </small>
          </>
        )}
      </div>

      <div className="tarefa-notificacao">
        <div className="tarefa-notificacao-switch">
          <InputSwitch checked={notificacaoAutomatica} onChange={(e) => setNotificacaoAutomatica(!!e.value)} />
          <label>Notificações automáticas por e-mail</label>
        </div>
        <div className="form-field">
          <label htmlFor="tf-lembretes">Lembretes (relativos à previsão de término)</label>
          <MultiSelect id="tf-lembretes" value={lembretes} options={LEMBRETE_OPTIONS}
            onChange={(e) => setLembretes(e.value)} placeholder="Nenhum lembrete" display="chip"
            className="w-full" baseZIndex={10000} disabled={!notificacaoAutomatica} />
        </div>
      </div>

      <ChecklistEditor itens={checklist} onChange={setChecklist} />

      <div className="form-field">
        <label htmlFor="tf-obs">Observações</label>
        <InputTextarea id="tf-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
          rows={2} className="w-full" autoResize />
      </div>
    </FormDialog>
  );
}

export default TarefaDialog;
