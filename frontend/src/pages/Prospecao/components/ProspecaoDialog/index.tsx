import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import FormDialog from '../../../../components/FormDialog';
import {
  prospecaoService,
  Prospecao,
  ProspecaoForm,
  ContatoMarcaRef,
  Ref,
  TipoProspecao,
  TIPO_LABEL,
} from '../../service';

interface InfluRef {
  id: string;
  nome: string;
  nicho?: string | null;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  influenciador: InfluRef | null;
  editando: Prospecao | null;
  marcas: Ref[];
}

const TIPO_OPTIONS = (Object.keys(TIPO_LABEL) as TipoProspecao[]).map((t) => ({ label: TIPO_LABEL[t], value: t }));

function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().split('T')[0];
}

function ProspecaoDialog({ visible, onHide, onSaved, onToast, influenciador, editando, marcas }: Readonly<Props>) {
  const [marcaId, setMarcaId] = useState<string | null>(null);
  const [contatoId, setContatoId] = useState<string | null>(null);
  const [contatos, setContatos] = useState<ContatoMarcaRef[]>([]);
  const [tipo, setTipo] = useState<TipoProspecao>('PROSPECAO');
  const [nicho, setNicho] = useState('');
  const [dataContato, setDataContato] = useState<Date | null>(new Date());
  const [observacoes, setObservacoes] = useState('');
  const [valorProposto, setValorProposto] = useState<number | null>(null);
  const [valorAceito, setValorAceito] = useState<number | null>(null);
  const [valorContraproposto, setValorContraproposto] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const influRef = editando ? editando.influenciador : influenciador;

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    if (editando) {
      setMarcaId(editando.marca?.id ?? null);
      setContatoId(editando.contatoMarca?.id ?? null);
      setContatos(editando.marca?.contatos ?? (editando.contatoMarca ? [editando.contatoMarca] : []));
      setTipo(editando.tipo ?? 'PROSPECAO');
      setNicho(editando.nicho ?? '');
      setDataContato(editando.dataContato ? new Date(editando.dataContato + 'T00:00:00') : null);
      setObservacoes(editando.observacoes ?? '');
      setValorProposto(editando.valorProposto ?? null);
      setValorAceito(editando.valorAceito ?? null);
      setValorContraproposto(editando.valorContraproposto ?? null);
    } else {
      setMarcaId(null);
      setContatoId(null);
      setContatos([]);
      setTipo('PROSPECAO');
      setNicho(influenciador?.nicho ?? '');
      setDataContato(new Date());
      setObservacoes('');
      setValorProposto(null);
      setValorAceito(null);
      setValorContraproposto(null);
    }
  }, [visible, editando, influenciador]);

  // Carrega contatos ao trocar de marca.
  useEffect(() => {
    if (!marcaId) {
      setContatos([]);
      return;
    }
    let cancelado = false;
    prospecaoService.buscarMarca(marcaId).then((m) => {
      if (!cancelado) setContatos(m.contatos ?? []);
    }).catch(() => { if (!cancelado) setContatos([]); });
    return () => { cancelado = true; };
  }, [marcaId]);

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: ProspecaoForm = {
        influenciador: { id: influRef!.id },
        marca: { id: marcaId! },
        contatoMarca: contatoId ? { id: contatoId } : null,
        dataContato: dateToIso(dataContato),
        tipo,
        nicho: nicho.trim(),
        observacoes: observacoes.trim(),
        valorProposto,
        valorAceito,
        valorContraproposto,
        status: editando ? editando.status : (tipo === 'RECEPTIVO' ? 'CONTATO_INICIAL' : 'RASCUNHO'),
        motivoEncerramento: editando ? editando.motivoEncerramento : null,
      };
      return editando ? prospecaoService.atualizar(editando.id, payload as unknown as Partial<Prospecao>) : prospecaoService.salvar(payload);
    },
    onSuccess: () => {
      onToast('success', editando ? 'Prospecção atualizada' : 'Prospecção criada');
      onSaved();
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao salvar');
    },
  });

  const salvar = () => {
    setSubmitted(true);
    if (!influRef || !marcaId) {
      onToast('warn', 'Selecione influenciador e marca.');
      return;
    }
    salvarMutation.mutate();
  };

  const contatoOptions = contatos.map((c) => ({
    label: `${c.nome ?? 'Contato'}${c.email ? ` — ${c.email}` : ''}`,
    value: c.id,
  }));

  return (
    <FormDialog
      visible={visible}
      onHide={onHide}
      title={editando ? 'Editar Prospecção' : 'Nova Prospecção'}
      icon={editando ? 'pi pi-pencil' : 'pi pi-plus'}
      onSave={salvar}
      loading={salvarMutation.isPending}
      width="640px"
    >
      <div className="form-field">
        <label>Influenciador</label>
        <InputText value={influRef?.nome ?? ''} disabled className="w-full" />
      </div>

      <div className={`form-field ${submitted && !marcaId ? 'field-error' : ''}`}>
        <label htmlFor="marca">Marca <span className="required">*</span></label>
        <Dropdown
          id="marca"
          value={marcaId}
          options={marcas.map((m) => ({ label: m.nome, value: m.id }))}
          onChange={(e) => { setMarcaId(e.value); setContatoId(null); }}
          placeholder="Selecione a marca"
          filter
          className="w-full"
          baseZIndex={10000}
        />
        {submitted && !marcaId && <small className="p-error"><i className="pi pi-exclamation-circle" /> Marca é obrigatória</small>}
      </div>

      <div className="form-field">
        <label htmlFor="contato">Contato da marca (recebe os follow-ups)</label>
        <Dropdown
          id="contato"
          value={contatoId}
          options={contatoOptions}
          onChange={(e) => setContatoId(e.value)}
          placeholder={marcaId ? 'Selecione o contato' : 'Selecione a marca primeiro'}
          disabled={!marcaId}
          className="w-full"
          baseZIndex={10000}
          emptyMessage="Marca sem contatos cadastrados"
        />
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="tipo">Tipo</label>
          <Dropdown id="tipo" value={tipo} options={TIPO_OPTIONS} onChange={(e) => setTipo(e.value)} className="w-full" baseZIndex={10000} />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="data">Data do contato</label>
          <Calendar id="data" value={dataContato} onChange={(e) => setDataContato(e.value as Date)} dateFormat="dd/mm/yy" showIcon className="w-full" baseZIndex={10000} />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="nicho">Nicho</label>
        <InputText id="nicho" value={nicho} onChange={(e) => setNicho(e.target.value)} className="w-full" placeholder="Puxado do influenciador, editável" />
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="vp">Valor proposto</label>
          <InputNumber inputId="vp" value={valorProposto} onValueChange={(e) => setValorProposto(e.value ?? null)} mode="currency" currency="BRL" locale="pt-BR" className="w-full" />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="vc">Contraproposta</label>
          <InputNumber inputId="vc" value={valorContraproposto} onValueChange={(e) => setValorContraproposto(e.value ?? null)} mode="currency" currency="BRL" locale="pt-BR" className="w-full" />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="va">Valor aceito</label>
          <InputNumber inputId="va" value={valorAceito} onValueChange={(e) => setValorAceito(e.value ?? null)} mode="currency" currency="BRL" locale="pt-BR" className="w-full" />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="obs">Observações</label>
        <InputTextarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full" autoResize />
      </div>
    </FormDialog>
  );
}

export default ProspecaoDialog;
