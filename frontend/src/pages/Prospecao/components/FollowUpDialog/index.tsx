import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import FormDialog from '../../../../components/FormDialog';
import { prospecaoService, Prospecao, STATUS_LABEL } from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
  prospecao: Prospecao | null;
}

function formatarDataHora(v: string): string {
  return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function FollowUpDialog({ visible, onHide, onSaved, onToast, prospecao }: Readonly<Props>) {
  const [data, setData] = useState<Date | null>(new Date());
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (visible) {
      setData(new Date());
      setObservacao('');
    }
  }, [visible]);

  const mutation = useMutation({
    mutationFn: () => prospecaoService.registrarFollowUp(prospecao!.id, {
      data: data ? data.toISOString() : undefined,
      observacao: observacao.trim(),
    }),
    onSuccess: (fu) => {
      const falhou = fu.logEmail?.status === 'FALHA';
      onToast(falhou ? 'warn' : 'success', falhou
        ? 'Follow-up registrado, mas o e-mail falhou (verifique conta SMTP).'
        : 'Follow-up registrado e e-mail enviado.');
      onSaved();
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message ?? 'Erro ao registrar follow-up');
    },
  });

  const followUps = prospecao?.followUps ?? [];

  return (
    <FormDialog
      visible={visible}
      onHide={onHide}
      title="Registrar Follow-up"
      icon="pi pi-send"
      onSave={() => mutation.mutate()}
      loading={mutation.isPending}
      width="560px"
    >
      <p className="followup-info">
        Um e-mail será enviado para <strong>{prospecao?.contatoMarca?.email ?? 'contato da marca não definido'}</strong>.
      </p>

      <div className="form-field">
        <label htmlFor="fu-data">Data</label>
        <Calendar id="fu-data" value={data} onChange={(e) => setData(e.value as Date)} showTime dateFormat="dd/mm/yy" showIcon className="w-full" baseZIndex={10000} />
      </div>

      <div className="form-field">
        <label htmlFor="fu-obs">Mensagem / observação</label>
        <InputTextarea id="fu-obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3} className="w-full" autoResize placeholder="Conteúdo do e-mail (opcional)" />
      </div>

      {followUps.length > 0 && (
        <div className="followup-historico">
          <h4>Histórico</h4>
          {followUps.map((fu) => (
            <div key={fu.id} className="followup-item">
              <div className="followup-item-head">
                <span>{formatarDataHora(fu.data)}</span>
                <span className="followup-status">{STATUS_LABEL[fu.statusProspecao]}</span>
              </div>
              {fu.observacao && <p>{fu.observacao}</p>}
              {fu.logEmail && <small className={fu.logEmail.status === 'FALHA' ? 'fu-falha' : 'fu-ok'}>E-mail: {fu.logEmail.status}</small>}
            </div>
          ))}
        </div>
      )}
    </FormDialog>
  );
}

export default FollowUpDialog;
