import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import FormDialog from '../../../../components/FormDialog';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import SelectComCadastro from '../../../../components/SelectComCadastro';
import { useAuth } from '../../../../contexts/AuthContext';
import { canAdd, MODULES } from '../../../../utils/roles';
import MarcaFormDialog from '../../../Marcas/components/MarcaFormDialog';
import InfluenciadorFormDialog from '../../../Influenciadores/components/InfluenciadorFormDialog';
import EntregaveisEditor from '../EntregaveisEditor';
import {
  publicidadeService,
  Publicidade,
  PublicidadeForm,
  Entregavel,
  Financeiro,
  StatusNota,
  StatusPagamento,
  FormaPagamento,
  Moeda,
  STATUS_NOTA_LABEL,
  STATUS_PAGAMENTO_LABEL,
  FORMA_PAGAMENTO_LABEL,
  MOEDA_LABEL,
} from '../../service';

export interface PublicidadeInicial {
  prospecaoId?: string;
  marca: { id: string; nome: string };
  influenciador: { id: string; nome: string };
  valorTotal: number | null;
  descricao?: string | null;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  inicial: PublicidadeInicial | null;
  editando: Publicidade | null;
}

const STATUS_NOTA_OPTIONS = (Object.keys(STATUS_NOTA_LABEL) as StatusNota[])
  .map((s) => ({ label: STATUS_NOTA_LABEL[s], value: s }));
const STATUS_PAGAMENTO_OPTIONS = (Object.keys(STATUS_PAGAMENTO_LABEL) as StatusPagamento[])
  .map((s) => ({ label: STATUS_PAGAMENTO_LABEL[s], value: s }));
const FORMA_OPTIONS = (Object.keys(FORMA_PAGAMENTO_LABEL) as FormaPagamento[])
  .map((f) => ({ label: FORMA_PAGAMENTO_LABEL[f], value: f }));

const FINANCEIRO_VAZIO: Financeiro = {
  dataEnvioNota: null, numeroNota: null, linkNota: null, dataVencimentoNota: null, moeda: 'BRL',
  statusNota: 'NAO_EMITIDA', statusPagamento: 'PENDENTE', formaPagamento: null,
  dataRecebimento: null, dataPrevistaRecebimento: null,
  valorTotal: null, valorAssessora: null, valorInfluenciador: null,
};

const MOEDA_OPTIONS = (Object.keys(MOEDA_LABEL) as Moeda[]).map((m) => ({ label: MOEDA_LABEL[m], value: m }));

function dateToIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().split('T')[0];
}
function isoToDate(v: string | null): Date | null {
  return v ? new Date(v + 'T00:00:00') : null;
}

function PublicidadeDialog({ visible, onHide, onSaved, onToast, inicial, editando }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [marcaId, setMarcaId] = useState<string | null>(null);
  const [influId, setInfluId] = useState<string | null>(null);
  const [parceiro, setParceiro] = useState('');
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [porcentagem, setPorcentagem] = useState<number>(20);
  const [financeiro, setFinanceiro] = useState<Financeiro>({ ...FINANCEIRO_VAZIO });
  const [entregaveis, setEntregaveis] = useState<Entregavel[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [marcaDialogVisible, setMarcaDialogVisible] = useState(false);
  const [influDialogVisible, setInfluDialogVisible] = useState(false);

  const travado = !!inicial; // marca/influ vêm da prospecção fechada
  const podeAddMarca = canAdd(authUser?.roles ?? [], MODULES.MARCAS.prefix);
  const podeAddInflu = canAdd(authUser?.roles ?? [], MODULES.INFLUENCIADORES.prefix);

  const { data: marcas = [] } = useQuery({ queryKey: ['publi-marcas'], queryFn: publicidadeService.listarMarcasAtivas, enabled: visible });
  const { data: influenciadores = [] } = useQuery({ queryKey: ['publi-influ'], queryFn: publicidadeService.listarInfluenciadoresAtivos, enabled: visible });
  const { data: formatos = [] } = useQuery({ queryKey: ['publi-formatos'], queryFn: publicidadeService.listarFormatos, enabled: visible });

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    setConfirmVisible(false);
    if (editando) {
      setMarcaId(editando.marca?.id ?? null);
      setInfluId(editando.influenciador?.id ?? null);
      setParceiro(editando.parceiro ?? '');
      setDescricao(editando.descricao ?? '');
      setObservacoes(editando.observacoes ?? '');
      setPorcentagem(editando.porcentagemAssessora ?? 20);
      setFinanceiro({ ...FINANCEIRO_VAZIO, ...editando.financeiro });
      setEntregaveis(editando.entregaveis ?? []);
    } else if (inicial) {
      setMarcaId(inicial.marca.id);
      setInfluId(inicial.influenciador.id);
      setParceiro('');
      setDescricao(inicial.descricao ?? '');
      setObservacoes('');
      setPorcentagem(20);
      setFinanceiro({ ...FINANCEIRO_VAZIO, valorTotal: inicial.valorTotal });
      setEntregaveis([]);
    } else {
      setMarcaId(null);
      setInfluId(null);
      setParceiro('');
      setDescricao('');
      setObservacoes('');
      setPorcentagem(20);
      setFinanceiro({ ...FINANCEIRO_VAZIO });
      setEntregaveis([]);
    }
  }, [visible, editando, inicial]);

  // Recalcula split quando muda valorTotal ou porcentagem.
  const recalcular = (valorTotal: number | null, pct: number) => {
    if (valorTotal == null) {
      setFinanceiro((f) => ({ ...f, valorTotal, valorAssessora: null, valorInfluenciador: null }));
      return;
    }
    const assessora = Math.round(valorTotal * pct) / 100;
    setFinanceiro((f) => ({ ...f, valorTotal, valorAssessora: assessora, valorInfluenciador: valorTotal - assessora }));
  };

  const patchFin = (p: Partial<Financeiro>) => setFinanceiro((f) => ({ ...f, ...p }));

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: PublicidadeForm = {
        marca: { id: marcaId! },
        influenciador: { id: influId! },
        prospecao: inicial?.prospecaoId ? { id: inicial.prospecaoId } : (editando?.prospecao ?? null),
        parceiro: parceiro.trim(),
        descricao: descricao.trim(),
        observacoes: observacoes.trim(),
        porcentagemAssessora: porcentagem,
        financeiro: { ...financeiro },
        entregaveis: entregaveis.map((e) => ({
          ...e,
          formato: e.formato ? { id: e.formato.id, descricao: e.formato.descricao } : null,
        })),
      };
      return editando ? publicidadeService.atualizar(editando.id, payload) : publicidadeService.salvar(payload);
    },
    onSuccess: () => {
      onToast('success', editando ? 'Publicidade atualizada' : 'Publicidade criada');
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
    if (!marcaId || !influId) {
      onToast('warn', 'Selecione marca e influenciador.');
      return;
    }
    setConfirmVisible(true);
  };

  const moedaCur = financeiro.moeda === 'USD' ? 'USD' : 'BRL';
  const moedaLoc = financeiro.moeda === 'USD' ? 'en-US' : 'pt-BR';

  return (
    <>
    <FormDialog
      visible={visible}
      onHide={onHide}
      title={editando ? 'Editar Publicidade' : 'Nova Publicidade'}
      icon={editando ? 'pi pi-pencil' : 'pi pi-plus'}
      onSave={salvar}
      loading={salvarMutation.isPending}
      width="920px"
    >
      <div className="form-field">
        <label htmlFor="p-descricao">Descrição</label>
        <InputText id="p-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full" placeholder="Resumo curto" maxLength={80} />
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className={`form-field ${submitted && !marcaId ? 'field-error' : ''}`} style={{ flex: 1 }}>
          <label htmlFor="p-marca">Marca <span className="required">*</span></label>
          {travado
            ? <InputText value={inicial?.marca.nome ?? ''} disabled className="w-full" />
            : (
              <SelectComCadastro onAdd={() => setMarcaDialogVisible(true)} visivel={podeAddMarca} title="Cadastrar nova marca">
                <Dropdown id="p-marca" value={marcaId} options={marcas.map((m) => ({ label: m.nome, value: m.id }))} onChange={(e) => setMarcaId(e.value)} placeholder="Marca" filter className="w-full" baseZIndex={10000} />
              </SelectComCadastro>
            )}
        </div>
        <div className={`form-field ${submitted && !influId ? 'field-error' : ''}`} style={{ flex: 1 }}>
          <label htmlFor="p-influ">Influenciador <span className="required">*</span></label>
          {travado
            ? <InputText value={inicial?.influenciador.nome ?? ''} disabled className="w-full" />
            : (
              <SelectComCadastro onAdd={() => setInfluDialogVisible(true)} visivel={podeAddInflu} title="Cadastrar novo influenciador">
                <Dropdown id="p-influ" value={influId} options={influenciadores.map((i) => ({ label: i.nome, value: i.id }))} onChange={(e) => setInfluId(e.value)} placeholder="Influenciador" filter className="w-full" baseZIndex={10000} />
              </SelectComCadastro>
            )}
        </div>
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="p-parceiro">Parceiro</label>
          <InputText id="p-parceiro" value={parceiro} onChange={(e) => setParceiro(e.target.value)} className="w-full" />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="p-pct">% Assessoria</label>
          <InputNumber inputId="p-pct" value={porcentagem} onValueChange={(e) => { const v = e.value ?? 0; setPorcentagem(v); recalcular(financeiro.valorTotal, v); }} suffix="%" min={0} max={100} className="w-full" />
        </div>
      </div>

      <div className="form-field">
        <EntregaveisEditor entregaveis={entregaveis} formatos={formatos} onChange={setEntregaveis} />
      </div>

      <fieldset className="financeiro-box">
        <legend>Financeiro</legend>
        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-moeda">Moeda</label>
            <Dropdown id="f-moeda" value={financeiro.moeda} options={MOEDA_OPTIONS} onChange={(e) => patchFin({ moeda: e.value })} className="w-full" baseZIndex={10000} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-num-nota">Nº da nota</label>
            <InputText id="f-num-nota" value={financeiro.numeroNota ?? ''} onChange={(e) => patchFin({ numeroNota: e.target.value || null })} className="w-full" placeholder="Ex: 0001234" />
          </div>
          <div className="form-field" style={{ flex: 2 }}>
            <label htmlFor="f-link-nota">Link da nota</label>
            <InputText id="f-link-nota" value={financeiro.linkNota ?? ''} onChange={(e) => patchFin({ linkNota: e.target.value || null })} className="w-full" placeholder="https://..." />
          </div>
        </div>
        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-total">Valor total</label>
            <InputNumber inputId="f-total" value={financeiro.valorTotal} onValueChange={(e) => recalcular(e.value ?? null, porcentagem)} mode="currency" currency={moedaCur} locale={moedaLoc} className="w-full" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-ass">Valor assessoria</label>
            <InputNumber inputId="f-ass" value={financeiro.valorAssessora} onValueChange={(e) => patchFin({ valorAssessora: e.value ?? null })} mode="currency" currency={moedaCur} locale={moedaLoc} className="w-full" />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-inf">Valor influenciador</label>
            <InputNumber inputId="f-inf" value={financeiro.valorInfluenciador} onValueChange={(e) => patchFin({ valorInfluenciador: e.value ?? null })} mode="currency" currency={moedaCur} locale={moedaLoc} className="w-full" />
          </div>
        </div>
        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-status-nota">Status da nota</label>
            <Dropdown id="f-status-nota" value={financeiro.statusNota} options={STATUS_NOTA_OPTIONS} onChange={(e) => patchFin({ statusNota: e.value })} className="w-full" baseZIndex={10000} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-status-pag">Status do pagamento</label>
            <Dropdown id="f-status-pag" value={financeiro.statusPagamento} options={STATUS_PAGAMENTO_OPTIONS} onChange={(e) => patchFin({ statusPagamento: e.value })} className="w-full" baseZIndex={10000} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-forma">Forma de pagamento</label>
            <Dropdown id="f-forma" value={financeiro.formaPagamento} options={FORMA_OPTIONS} onChange={(e) => patchFin({ formaPagamento: e.value })} placeholder="—" className="w-full" baseZIndex={10000} showClear />
          </div>
        </div>
        <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-nota">Envio da nota</label>
            <Calendar inputId="f-nota" value={isoToDate(financeiro.dataEnvioNota)} onChange={(e) => patchFin({ dataEnvioNota: dateToIso(e.value as Date) })} dateFormat="dd/mm/yy" showIcon className="w-full" baseZIndex={10000} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-venc">Vencimento da nota</label>
            <Calendar inputId="f-venc" value={isoToDate(financeiro.dataVencimentoNota)} onChange={(e) => patchFin({ dataVencimentoNota: dateToIso(e.value as Date) })} dateFormat="dd/mm/yy" showIcon className="w-full" baseZIndex={10000} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-prev">Recebimento previsto</label>
            <Calendar inputId="f-prev" value={isoToDate(financeiro.dataPrevistaRecebimento)} onChange={(e) => patchFin({ dataPrevistaRecebimento: dateToIso(e.value as Date) })} dateFormat="dd/mm/yy" showIcon className="w-full" baseZIndex={10000} />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="f-receb">Recebimento</label>
            <Calendar inputId="f-receb" value={isoToDate(financeiro.dataRecebimento)} onChange={(e) => patchFin({ dataRecebimento: dateToIso(e.value as Date) })} dateFormat="dd/mm/yy" showIcon className="w-full" baseZIndex={10000} />
          </div>
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="p-obs">Observações</label>
        <InputTextarea id="p-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full" autoResize />
      </div>
    </FormDialog>

    <ConfirmDialog
      visible={confirmVisible}
      onHide={() => setConfirmVisible(false)}
      onConfirm={() => { setConfirmVisible(false); salvarMutation.mutate(); }}
      title={editando ? 'Confirmar alteração' : 'Confirmar publicidade'}
      icon="pi pi-megaphone"
      message={editando ? 'Salvar as alterações desta publicidade?' : 'Criar esta publicidade?'}
      confirmLabel="Salvar"
      confirmIcon="pi pi-check"
      confirmSeverity="success"
    />

    <MarcaFormDialog
      visible={marcaDialogVisible}
      onHide={() => setMarcaDialogVisible(false)}
      onSaved={(marca) => { queryClient.invalidateQueries({ queryKey: ['publi-marcas'] }); setMarcaId(marca.id); }}
    />
    <InfluenciadorFormDialog
      visible={influDialogVisible}
      onHide={() => setInfluDialogVisible(false)}
      onSaved={(influ) => { queryClient.invalidateQueries({ queryKey: ['publi-influ'] }); setInfluId(influ.id); }}
    />
    </>
  );
}

export default PublicidadeDialog;
