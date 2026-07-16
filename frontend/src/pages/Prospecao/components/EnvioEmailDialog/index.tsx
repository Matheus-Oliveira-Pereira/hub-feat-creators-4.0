import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chips } from 'primereact/chips';
import { Editor } from 'primereact/editor';
import FormDialog from '../../../../components/FormDialog';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import AssistenteIa from '../../../../components/AssistenteIa';
import { templateEmailService, TipoTemplateEmail } from '../../../TemplatesEmail/service';
import { prospecaoService, Prospecao, STATUS_LABEL } from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  prospecao: Prospecao | null;
  tipo: TipoTemplateEmail;
  registrarComoFollowUp: boolean;
}

function formatarDataHora(v: string): string {
  return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function EnvioEmailDialog({ visible, onHide, onSaved, onToast, prospecao, tipo, registrarComoFollowUp }: Readonly<Props>) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [cco, setCco] = useState<string[]>([]);
  const [mostrarCopias, setMostrarCopias] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates-por-tipo', tipo],
    queryFn: () => templateEmailService.listarPorTipo(tipo),
    enabled: visible,
  });

  const destino = prospecao?.contatoMarca?.email ?? null;

  // Ao abrir, limpa e auto-seleciona o template padrão.
  useEffect(() => {
    if (!visible) return;
    setAssunto('');
    setCorpo('');
    setObservacoes('');
    setCc([]);
    setCco([]);
    setMostrarCopias(false);
    setTemplateId(null);
    setConfirmVisible(false);
  }, [visible]);

  useEffect(() => {
    if (visible && templateId === null && templates.length > 0) {
      const padrao = templates.find((t) => t.padrao) ?? templates[0];
      setTemplateId(padrao.id);
    }
  }, [templates, visible, templateId]);

  // Renderiza o template selecionado (variáveis substituídas) no assunto/corpo.
  useEffect(() => {
    if (!visible || !templateId || !prospecao) return;
    let cancelado = false;
    templateEmailService.render(templateId, prospecao.id)
      .then((r) => { if (!cancelado) { setAssunto(r.assunto); setCorpo(r.corpo); } })
      .catch(() => { /* mantém vazio */ });
    return () => { cancelado = true; };
  }, [templateId, visible, prospecao]);

  const mutation = useMutation({
    mutationFn: () => {
      const copias = { cc: cc.length ? cc : undefined, cco: cco.length ? cco : undefined };
      if (registrarComoFollowUp) {
        return prospecaoService.registrarFollowUp(prospecao!.id, { assunto, corpo, observacoes: observacoes.trim() || undefined, ...copias });
      }
      return prospecaoService.enviarEmailContato(prospecao!.id, { assunto, corpo, ...copias });
    },
    onSuccess: (res: unknown) => {
      const status = (res as { logEmail?: { status: string }; status?: string }).logEmail?.status
        ?? (res as { status?: string }).status;
      const falhou = status === 'FALHA';
      onToast(falhou ? 'warn' : 'success', falhou
        ? 'E-mail falhou (verifique a conta SMTP).'
        : 'E-mail enviado.');
      onSaved();
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao enviar e-mail');
    },
  });

  const templateOptions = templates.map((t) => ({ label: t.nome + (t.padrao ? ' (padrão)' : ''), value: t.id }));
  const followUps = prospecao?.followUps ?? [];
  const titulo = registrarComoFollowUp ? 'Registrar Follow-up' : 'E-mail de Contato Inicial';

  const pedirConfirmacao = () => {
    if (!destino) {
      onToast('warn', 'Prospecção sem contato de marca com e-mail.');
      return;
    }
    setConfirmVisible(true);
  };

  return (
    <>
    <FormDialog
      visible={visible}
      onHide={onHide}
      title={titulo}
      icon="pi pi-send"
      onSave={pedirConfirmacao}
      loading={mutation.isPending}
      saveLabel="Enviar e-mail"
      saveIcon="pi pi-send"
      width="660px"
    >
      {!destino && (
        <p className="followup-info" style={{ color: '#dc2626' }}>
          <i className="pi pi-exclamation-triangle" /> Prospecção sem contato de marca com e-mail. Defina o contato antes de enviar.
        </p>
      )}
      {destino && (
        <p className="followup-info">
          Destinatário: <strong>{destino}</strong>
          {!mostrarCopias && (
            <button type="button" className="btn-add-copias" onClick={() => setMostrarCopias(true)}
              style={{ marginLeft: '0.6rem', border: 'none', background: 'none', color: 'var(--primary-color, #6366f1)', cursor: 'pointer', fontSize: '0.82rem' }}>
              + CC/CCO
            </button>
          )}
        </p>
      )}

      {mostrarCopias && (
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="ee-cc">CC</label>
            <Chips id="ee-cc" value={cc} onChange={(e) => setCc(e.value ?? [])} separator="," className="w-full" placeholder="E-mail e Enter" />
          </div>
          <div className="form-field">
            <label htmlFor="ee-cco">CCO (cópia oculta)</label>
            <Chips id="ee-cco" value={cco} onChange={(e) => setCco(e.value ?? [])} separator="," className="w-full" placeholder="E-mail e Enter" />
          </div>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="ee-template">Template</label>
        <Dropdown id="ee-template" value={templateId} options={templateOptions} onChange={(e) => setTemplateId(e.value)}
          placeholder="Selecione um template" className="w-full" baseZIndex={10000} emptyMessage="Nenhum template deste tipo" />
      </div>

      <div className="form-field">
        <label htmlFor="ee-assunto">Assunto</label>
        <InputText id="ee-assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} className="w-full" />
      </div>

      <div className="form-field">
        <div className="label-com-acao">
          <label>Corpo</label>
          <AssistenteIa value={corpo} onResult={setCorpo} />
        </div>
        <Editor value={corpo} onTextChange={(e) => setCorpo(e.htmlValue ?? '')} style={{ height: '200px' }} />
      </div>

      {registrarComoFollowUp && (
        <div className="form-field">
          <label htmlFor="ee-obs">Observações internas</label>
          <InputTextarea id="ee-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full" autoResize placeholder="Nota interna, não enviada no e-mail (opcional)" />
        </div>
      )}

      {registrarComoFollowUp && followUps.length > 0 && (
        <div className="followup-historico">
          <h4>Histórico</h4>
          {followUps.map((fu) => (
            <div key={fu.id} className="followup-item">
              <div className="followup-item-head">
                <span>{formatarDataHora(fu.data)}</span>
                <span className="followup-status">{STATUS_LABEL[fu.statusProspecao]}</span>
              </div>
              {fu.observacoes && <p className="fu-interna"><i className="pi pi-lock" /> {fu.observacoes}</p>}
              {fu.logEmail && <small className={fu.logEmail.status === 'FALHA' ? 'fu-falha' : 'fu-ok'}>E-mail: {fu.logEmail.status}</small>}
            </div>
          ))}
        </div>
      )}
    </FormDialog>

    <ConfirmDialog
      visible={confirmVisible}
      onHide={() => setConfirmVisible(false)}
      onConfirm={() => { setConfirmVisible(false); mutation.mutate(); }}
      title="Confirmar envio"
      icon="pi pi-send"
      message={`Enviar este e-mail para ${destino}?`}
      confirmLabel="Enviar"
      confirmIcon="pi pi-send"
      confirmSeverity="success"
    />
    </>
  );
}

export default EnvioEmailDialog;
