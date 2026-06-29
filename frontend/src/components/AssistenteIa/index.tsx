import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { iaService } from '../../services/iaService';
import './styles.scss';

interface Props {
  /** Texto atual (HTML ou texto puro) que será enviado para a IA. */
  value: string;
  /** Recebe o texto editado pela IA. */
  onResult: (texto: string) => void;
  /** Rótulo do botão. */
  label?: string;
  disabled?: boolean;
}

const SUGESTOES = [
  'Deixe mais formal',
  'Deixe mais descontraído',
  'Resuma',
  'Corrija a gramática',
];

function AssistenteIa({ value, onResult, label = 'Editar com IA', disabled }: Readonly<Props>) {
  const [visible, setVisible] = useState(false);
  const [comando, setComando] = useState('');
  const [carregando, setCarregando] = useState(false);
  const toast = useRef<Toast>(null);

  const abrir = () => { setComando(''); setVisible(true); };

  const aplicar = async () => {
    if (!comando.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Descreva o que a IA deve fazer.' });
      return;
    }
    setCarregando(true);
    try {
      const texto = await iaService.editarTexto(value, comando.trim());
      onResult(texto);
      toast.current?.show({ severity: 'success', summary: 'Pronto', detail: 'Texto atualizado pela IA.' });
      setVisible(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message ?? 'Falha ao editar com IA.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <button type="button" className="assistente-ia-btn" onClick={abrir} disabled={disabled} title={label}>
        <i className="pi pi-sparkles" /> {label}
      </button>

      <Dialog
        header={<span><i className="pi pi-sparkles" /> Editar com IA</span>}
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: '480px' }}
        modal
        baseZIndex={10000}
        draggable={false}
      >
        <div className="assistente-ia-body">
          <label htmlFor="ia-comando">O que a IA deve fazer com o texto?</label>
          <InputTextarea
            id="ia-comando"
            value={comando}
            onChange={(e) => setComando(e.target.value)}
            rows={3}
            autoResize
            autoFocus
            className="w-full"
            placeholder="Ex: deixe mais formal e adicione uma chamada para resposta"
          />
          <div className="assistente-ia-sugestoes">
            {SUGESTOES.map((s) => (
              <button key={s} type="button" className="sugestao-chip" onClick={() => setComando(s)}>{s}</button>
            ))}
          </div>
          <div className="assistente-ia-acoes">
            <Button label="Cancelar" className="p-button-text" onClick={() => setVisible(false)} disabled={carregando} />
            <Button label="Aplicar" icon="pi pi-check" onClick={aplicar} loading={carregando} />
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default AssistenteIa;
