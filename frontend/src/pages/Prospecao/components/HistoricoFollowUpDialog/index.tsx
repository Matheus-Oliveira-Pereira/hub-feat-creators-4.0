import { Dialog } from 'primereact/dialog';
import { Prospecao, STATUS_LABEL } from '../../service';

interface Props {
  visible: boolean;
  onHide: () => void;
  prospecao: Prospecao | null;
}

function formatarDataHora(v: string): string {
  return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function HistoricoFollowUpDialog({ visible, onHide, prospecao }: Readonly<Props>) {
  const followUps = prospecao?.followUps ?? [];

  return (
    <Dialog
      header={<span><i className="pi pi-history" /> Histórico de follow-ups</span>}
      visible={visible}
      onHide={onHide}
      style={{ width: '520px' }}
      modal
      draggable={false}
    >
      {prospecao && (
        <p className="followup-info">
          {prospecao.descricao?.trim() || prospecao.marca?.nome} — {prospecao.contatoMarca?.nome ?? 'sem contato'}
        </p>
      )}

      {followUps.length === 0 && <p className="followup-vazio">Nenhum follow-up registrado.</p>}

      {followUps.length > 0 && (
        <div className="followup-historico">
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
    </Dialog>
  );
}

export default HistoricoFollowUpDialog;
