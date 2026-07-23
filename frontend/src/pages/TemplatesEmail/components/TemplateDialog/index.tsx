import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Editor } from 'primereact/editor';
import FormDialog from '../../../../components/FormDialog';
import StatusDropdown from '../../../../components/StatusDropdown';
import AssistenteIa from '../../../../components/AssistenteIa';
import VariaveisBar from '../VariaveisBar';
import {
  templateEmailService,
  TemplateEmail,
  TemplateEmailDTO,
  TemplateEmailForm,
  TipoTemplateEmail,
  TIPO_TEMPLATE_LABEL,
} from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  onSaved: (saved?: TemplateEmailDTO) => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  editando: TemplateEmail | null;
  copiando?: boolean;
  /** Tipo inicial ao criar (usado no cadastro na hora a partir de outro modal). */
  tipoInicial?: TipoTemplateEmail;
}

const TIPO_OPTIONS = (Object.keys(TIPO_TEMPLATE_LABEL) as TipoTemplateEmail[])
  .map((t) => ({ label: TIPO_TEMPLATE_LABEL[t], value: t }));

function TemplateDialog({ visible, onHide, onSaved, onToast, editando, copiando = false, tipoInicial }: Readonly<Props>) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoTemplateEmail>('PROSPECAO');
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [padrao, setPadrao] = useState(false);
  const [status, setStatus] = useState('ATIVO');
  const [submitted, setSubmitted] = useState(false);

  const assuntoRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor>(null);
  const lastFocus = useRef<'assunto' | 'corpo'>('corpo');

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    if (editando) {
      setNome(copiando ? '' : editando.nome);
      setTipo(editando.tipo);
      setAssunto(editando.assunto);
      setCorpo(editando.corpo ?? '');
      setPadrao(copiando ? false : editando.padrao);
      setStatus(copiando ? 'ATIVO' : editando.status);
    } else {
      setNome('');
      setTipo(tipoInicial ?? 'PROSPECAO');
      setAssunto('');
      setCorpo('');
      setPadrao(false);
      setStatus('ATIVO');
    }
  }, [visible, editando, copiando, tipoInicial]);

  const inserirVariavel = (token: string) => {
    if (lastFocus.current === 'assunto' && assuntoRef.current) {
      const el = assuntoRef.current;
      const start = el.selectionStart ?? assunto.length;
      const end = el.selectionEnd ?? assunto.length;
      const novo = assunto.slice(0, start) + token + assunto.slice(end);
      setAssunto(novo);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
      return;
    }
    // Editor (Quill)
    const quill = editorRef.current?.getQuill() as
      | { getSelection: (focus?: boolean) => { index: number } | null; getLength: () => number; insertText: (i: number, t: string, src?: string) => void; root: HTMLElement }
      | undefined;
    if (quill) {
      const range = quill.getSelection(true) ?? { index: quill.getLength() };
      quill.insertText(range.index, token, 'user');
      setCorpo(quill.root.innerHTML);
    } else {
      setCorpo((c) => c + token);
    }
  };

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: TemplateEmailForm = { nome: nome.trim(), tipo, assunto: assunto.trim(), corpo, padrao, status };
      return (editando && !copiando) ? templateEmailService.atualizar(editando.id, payload) : templateEmailService.salvar(payload);
    },
    onSuccess: (saved) => {
      let msg = 'Template criado';
      if (copiando) msg = 'Template copiado';
      else if (editando) msg = 'Template atualizado';
      onToast('success', msg);
      onSaved(saved as TemplateEmailDTO);
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao salvar');
    },
  });

  const salvar = () => {
    setSubmitted(true);
    if (!nome.trim() || !assunto.trim()) {
      onToast('warn', 'Preencha nome e assunto.');
      return;
    }
    salvarMutation.mutate();
  };

  let titulo = 'Novo Template';
  let icone = 'pi pi-plus';
  if (copiando) { titulo = 'Copiar Template'; icone = 'pi pi-copy'; }
  else if (editando) { titulo = 'Editar Template'; icone = 'pi pi-pencil'; }

  return (
    <FormDialog
      visible={visible}
      onHide={onHide}
      title={titulo}
      icon={icone}
      onSave={salvar}
      loading={salvarMutation.isPending}
      width="720px"
    >
      {copiando && (
        <div className="copia-hint">
          <i className="pi pi-info-circle" /> Cópia de template. Defina uma <strong>descrição (nome)</strong> única para o novo template.
        </div>
      )}
      <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
        <div className={`form-field ${submitted && !nome.trim() ? 'field-error' : ''}`} style={{ flex: 2 }}>
          <label htmlFor="t-nome">Nome <span className="required">*</span></label>
          <InputText id="t-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" />
        </div>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="t-tipo">Tipo</label>
          <Dropdown id="t-tipo" value={tipo} options={TIPO_OPTIONS} onChange={(e) => setTipo(e.value)} className="w-full" baseZIndex={10000} />
        </div>
      </div>

      <VariaveisBar onInsert={inserirVariavel} />

      <div className={`form-field ${submitted && !assunto.trim() ? 'field-error' : ''}`}>
        <label htmlFor="t-assunto">Assunto <span className="required">*</span></label>
        <InputText
          id="t-assunto"
          ref={assuntoRef}
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          onFocus={() => { lastFocus.current = 'assunto'; }}
          className="w-full"
        />
      </div>

      <div className="form-field">
        <div className="label-com-acao">
          <label>Corpo</label>
          <AssistenteIa value={corpo} onResult={setCorpo} />
        </div>
        <div onFocus={() => { lastFocus.current = 'corpo'; }}>
          <Editor
            ref={editorRef}
            value={corpo}
            onTextChange={(e) => setCorpo(e.htmlValue ?? '')}
            style={{ height: '220px' }}
          />
        </div>
      </div>

      <div className="form-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="form-field" style={{ flex: 1 }}>
          <label htmlFor="t-status">Status</label>
          <StatusDropdown id="t-status" value={status} onChange={(e) => setStatus(e.value)} className="w-full" baseZIndex={10000} />
        </div>
        <div className="form-field" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <InputSwitch checked={padrao} onChange={(e) => setPadrao(e.value)} />
          <label style={{ margin: 0 }}>Padrão para este tipo</label>
        </div>
      </div>
    </FormDialog>
  );
}

export default TemplateDialog;
