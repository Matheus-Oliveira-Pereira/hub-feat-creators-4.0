import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Chips } from 'primereact/chips';
import { Editor } from 'primereact/editor';
import FormDialog from '../../../../components/FormDialog';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { tarefaService, TarefaDTO, responsavelNome } from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  tarefa: TarefaDTO | null;
}

function EnvioEmailTarefaDialog({ visible, onHide, onToast, tarefa }: Readonly<Props>) {
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [cco, setCco] = useState<string[]>([]);
  const [mostrarCopias, setMostrarCopias] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAssunto(tarefa ? `Tarefa — ${tarefa.titulo}` : '');
    setCorpo('');
    setCc([]);
    setCco([]);
    setMostrarCopias(false);
    setConfirmVisible(false);
  }, [visible, tarefa]);

  const mutation = useMutation({
    mutationFn: () => tarefaService.enviarEmail(tarefa!.id, {
      assunto: assunto.trim() || undefined,
      corpo: corpo.trim() || undefined,
      cc: cc.length ? cc : undefined,
      cco: cco.length ? cco : undefined,
    }),
    onSuccess: (res: unknown) => {
      const falhou = (res as { status?: string }).status === 'FALHA';
      onToast(falhou ? 'warn' : 'success', falhou ? 'E-mail falhou (verifique a conta SMTP).' : 'E-mail enviado.');
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao enviar e-mail');
    },
  });

  const destinatario = tarefa ? responsavelNome(tarefa) : '—';

  return (
    <>
      <FormDialog
        visible={visible}
        onHide={onHide}
        title="Enviar E-mail da Tarefa"
        icon="pi pi-send"
        onSave={() => setConfirmVisible(true)}
        loading={mutation.isPending}
        saveLabel="Enviar e-mail"
        saveIcon="pi pi-send"
        width="660px"
      >
        <p className="followup-info">
          Destinatário: <strong>{destinatario}</strong> (responsável pela tarefa)
          {!mostrarCopias && (
            <button type="button" onClick={() => setMostrarCopias(true)}
              style={{ marginLeft: '0.6rem', border: 'none', background: 'none', color: 'var(--primary-color, #6366f1)', cursor: 'pointer', fontSize: '0.82rem' }}>
              + CC/CCO
            </button>
          )}
        </p>

        {mostrarCopias && (
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="te-cc">CC</label>
              <Chips id="te-cc" value={cc} onChange={(e) => setCc(e.value ?? [])} separator="," className="w-full" placeholder="E-mail e Enter" />
            </div>
            <div className="form-field">
              <label htmlFor="te-cco">CCO (cópia oculta)</label>
              <Chips id="te-cco" value={cco} onChange={(e) => setCco(e.value ?? [])} separator="," className="w-full" placeholder="E-mail e Enter" />
            </div>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="te-assunto">Assunto</label>
          <InputText id="te-assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} className="w-full" />
        </div>

        <div className="form-field">
          <label>Corpo (vazio = resumo padrão da tarefa)</label>
          <Editor value={corpo} onTextChange={(e) => setCorpo(e.htmlValue ?? '')} style={{ height: '200px' }} />
        </div>
      </FormDialog>

      <ConfirmDialog
        visible={confirmVisible}
        onHide={() => setConfirmVisible(false)}
        onConfirm={() => { setConfirmVisible(false); mutation.mutate(); }}
        title="Confirmar envio"
        icon="pi pi-send"
        message={`Enviar este e-mail ao responsável (${destinatario})?`}
        confirmLabel="Enviar"
        confirmIcon="pi pi-send"
        confirmSeverity="success"
      />
    </>
  );
}

export default EnvioEmailTarefaDialog;
