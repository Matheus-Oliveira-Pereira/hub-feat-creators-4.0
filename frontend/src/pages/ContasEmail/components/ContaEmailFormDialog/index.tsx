import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Chips } from 'primereact/chips';
import { Toast } from 'primereact/toast';
import FormDialog from '../../../../components/FormDialog';
import StatusDropdown from '../../../../components/StatusDropdown';
import { contaEmailService, ContaEmailDTO, ContaEmailForm } from '../../service';

interface ContaEmailFormDialogProps {
  visible: boolean;
  onHide: () => void;
  /** Preenchido = edição. */
  editId?: string | null;
  /** Preenchido (e sem editId) = copiar esta conta como nova. */
  copyFromId?: string | null;
  defaultNome?: string;
  onSaved?: (saved: ContaEmailDTO) => void;
}

interface FormErrors { nome?: string; host?: string; usuario?: string; senha?: string; }

const FORM_VAZIO: ContaEmailForm = {
  nome: '', host: '', porta: 587, usuario: '', remetenteNome: '', senha: '', tls: true,
  imapHost: '', imapPorta: null, salvarEnviados: true, copiaOculta: '',
  sistema: false, status: 'ATIVO',
};

/** CSV → chips e vice-versa (campo copiaOculta guarda string no backend). */
const csvParaChips = (csv?: string | null): string[] =>
  (csv ?? '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
const chipsParaCsv = (chips: string[]): string => chips.map((s) => s.trim()).filter(Boolean).join(', ');

/** Modal autossuficiente de cadastro/edição/cópia de Conta de E-mail. */
function ContaEmailFormDialog({ visible, onHide, editId, copyFromId, defaultNome, onSaved }: ContaEmailFormDialogProps) {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);

  const [form, setForm] = useState<ContaEmailForm>(FORM_VAZIO);
  const [senhaConfigurada, setSenhaConfigurada] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const editando = !!editId;
  const copiando = !editId && !!copyFromId;

  useEffect(() => {
    if (!visible) return;
    setErrors({}); setSubmitted(false);
    if (editId) {
      contaEmailService.buscar(editId).then((data) => {
        setForm({
          nome: data.nome, host: data.host, porta: data.porta, usuario: data.usuario,
          remetenteNome: data.remetenteNome ?? '', senha: '', tls: data.tls ?? true,
          imapHost: data.imapHost ?? '', imapPorta: data.imapPorta,
          salvarEnviados: data.salvarEnviados ?? true, copiaOculta: data.copiaOculta ?? '',
          sistema: data.sistema, status: data.status,
        });
        setSenhaConfigurada(true);
      }).catch(() => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar conta' }));
    } else if (copyFromId) {
      contaEmailService.buscar(copyFromId).then((data) => {
        setForm({
          nome: '', host: data.host, porta: data.porta, usuario: '',
          remetenteNome: data.remetenteNome ?? '', senha: '', tls: data.tls ?? true,
          imapHost: data.imapHost ?? '', imapPorta: data.imapPorta,
          salvarEnviados: data.salvarEnviados ?? true, copiaOculta: data.copiaOculta ?? '',
          sistema: false, status: 'ATIVO',
        });
        setSenhaConfigurada(false);
      }).catch(() => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar conta' }));
    } else {
      setForm({ ...FORM_VAZIO, nome: defaultNome ?? '' });
      setSenhaConfigurada(false);
    }
  }, [visible, editId, copyFromId, defaultNome]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contas-email'] });
    queryClient.invalidateQueries({ queryKey: ['contas-email-options'] });
  };

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<ContaEmailForm> = { ...form };
      if (!payload.senha?.trim()) delete payload.senha;
      return editando ? contaEmailService.atualizar(editId!, payload) : contaEmailService.salvar(payload);
    },
    onSuccess: (saved) => {
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Conta atualizada' : 'Conta criada' });
      invalidate();
      onSaved?.(saved as ContaEmailDTO);
      onHide();
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!form.host.trim()) errs.host = 'Servidor SMTP é obrigatório';
    if (!form.usuario.trim()) errs.usuario = 'Usuário (e-mail) é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.usuario.trim())) errs.usuario = 'E-mail inválido';
    if (copiando && !form.senha?.trim()) errs.senha = 'Informe a senha da nova conta';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const salvar = () => {
    setSubmitted(true);
    if (!validar()) return;
    salvarMutation.mutate();
  };

  const titulo = copiando ? 'Copiar Conta' : (editando ? 'Editar Conta' : 'Nova Conta');
  const icone = copiando ? 'pi pi-copy' : (editando ? 'pi pi-pencil' : 'pi pi-at');

  return (
    <>
      <Toast ref={toast} />
      <FormDialog visible={visible} onHide={onHide} title={titulo} icon={icone} onSave={salvar} loading={salvarMutation.isPending}>
        {copiando && (
          <div className="copia-hint">
            <i className="pi pi-info-circle" /> Cópia de conta. Defina um <strong>nome</strong>, um <strong>usuário/e-mail</strong> e a <strong>senha</strong> próprios para a nova conta.
          </div>
        )}
        <div className={`form-field ${submitted && errors.nome ? 'field-error' : ''}`}>
          <label htmlFor="nome">Nome <span className="required">*</span></label>
          <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" placeholder="Ex: Conta principal" />
          {submitted && errors.nome && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.nome}</small>}
        </div>
        <div className="form-grid-2">
          <div className={`form-field ${submitted && errors.host ? 'field-error' : ''}`}>
            <label htmlFor="host">Servidor SMTP <span className="required">*</span></label>
            <InputText id="host" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="w-full" placeholder="smtp.gmail.com" />
            {submitted && errors.host && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.host}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="porta">Porta</label>
            <InputNumber id="porta" value={form.porta} onValueChange={(e) => setForm({ ...form, porta: e.value ?? null })} useGrouping={false} className="w-full" placeholder="587" />
          </div>
        </div>
        <div className={`form-field ${submitted && errors.usuario ? 'field-error' : ''}`}>
          <label htmlFor="usuario">Usuário / E-mail remetente <span className="required">*</span></label>
          <InputText id="usuario" type="email" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} className="w-full" placeholder="contato@empresa.com" autoComplete="off" />
          {submitted && errors.usuario && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.usuario}</small>}
        </div>
        <div className="form-field">
          <label htmlFor="remetenteNome">Nome do remetente</label>
          <InputText id="remetenteNome" value={form.remetenteNome} onChange={(e) => setForm({ ...form, remetenteNome: e.target.value })} className="w-full" placeholder="Hub Feat Creators" />
        </div>
        <div className={`form-field ${submitted && errors.senha ? 'field-error' : ''}`}>
          <label htmlFor="senha">Senha {copiando && <span className="required">*</span>}</label>
          <InputText id="senha" type="password" value={form.senha ?? ''} onChange={(e) => setForm({ ...form, senha: e.target.value })} className="w-full"
            placeholder={senhaConfigurada ? '•••••••••• (já configurada — preencha para alterar)' : 'Senha ou app password'} autoComplete="new-password" />
          {submitted && errors.senha
            ? <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.senha}</small>
            : <small className="config-hint">{senhaConfigurada ? 'Deixe em branco para manter a senha atual.' : 'Armazenada criptografada; nunca é exibida.'}</small>}
        </div>
        <div className="form-grid-2">
          <div className="form-field switch-field">
            <InputSwitch id="tls" checked={form.tls} onChange={(e) => setForm({ ...form, tls: !!e.value })} />
            <label htmlFor="tls">Usar STARTTLS</label>
          </div>
          <div className="form-field switch-field">
            <InputSwitch id="sistema" checked={form.sistema} onChange={(e) => setForm({ ...form, sistema: !!e.value })} />
            <label htmlFor="sistema">Conta do sistema (padrão)</label>
          </div>
        </div>

        <div className="bloco-avancado">
          <span className="bloco-avancado-titulo"><i className="pi pi-inbox" /> Pasta Enviados e cópias</span>
          <div className="form-field switch-field">
            <InputSwitch id="salvarEnviados" checked={form.salvarEnviados} onChange={(e) => setForm({ ...form, salvarEnviados: !!e.value })} />
            <label htmlFor="salvarEnviados">Salvar cópia na pasta Enviados (IMAP)</label>
          </div>
          <small className="config-hint">Gmail/Google Workspace já salvam automaticamente — desative para evitar duplicados.</small>
          {form.salvarEnviados && (
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="imapHost">Servidor IMAP</label>
                <InputText id="imapHost" value={form.imapHost} onChange={(e) => setForm({ ...form, imapHost: e.target.value })} className="w-full"
                  placeholder={form.host.trim() ? `auto: ${form.host.trim().toLowerCase().startsWith('smtp.') ? 'imap.' + form.host.trim().slice(5) : 'imap.' + form.host.trim()}` : 'auto (derivado do SMTP)'} />
              </div>
              <div className="form-field">
                <label htmlFor="imapPorta">Porta IMAP</label>
                <InputNumber id="imapPorta" value={form.imapPorta} onValueChange={(e) => setForm({ ...form, imapPorta: e.value ?? null })} useGrouping={false} className="w-full" placeholder="993" />
              </div>
            </div>
          )}
          <div className="form-field">
            <label htmlFor="copiaOculta">Cópia oculta automática (CCO)</label>
            <Chips id="copiaOculta" value={csvParaChips(form.copiaOculta)} onChange={(e) => setForm({ ...form, copiaOculta: chipsParaCsv(e.value ?? []) })}
              separator="," className="w-full" placeholder="Digite o e-mail e Enter" />
            <small className="config-hint">Todo e-mail enviado por esta conta copia oculto estes endereços.</small>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </FormDialog>
    </>
  );
}

export default ContaEmailFormDialog;
