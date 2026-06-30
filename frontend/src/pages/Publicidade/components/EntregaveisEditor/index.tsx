import { useState } from 'react';
import { Button } from 'primereact/button';
import EntregavelDialog from './EntregavelDialog';
import {
  Entregavel,
  FormatoRef,
  STATUS_ENTREGAVEL_LABEL,
} from '../../service';
import './styles.scss';

interface Props {
  entregaveis: Entregavel[];
  formatos: FormatoRef[];
  onChange: (e: Entregavel[]) => void;
}

function formatarData(iso: string | null): string {
  if (!iso) return 'Sem data';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function EntregaveisEditor({ entregaveis, formatos, onChange }: Readonly<Props>) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const abrirNovo = () => { setEditIndex(null); setDialogVisible(true); };
  const abrirEdicao = (i: number) => { setEditIndex(i); setDialogVisible(true); };
  const remover = (i: number) => onChange(entregaveis.filter((_, idx) => idx !== i));

  const salvar = (e: Entregavel) => {
    if (editIndex !== null) {
      onChange(entregaveis.map((item, idx) => (idx === editIndex ? e : item)));
    } else {
      onChange([...entregaveis, e]);
    }
    setDialogVisible(false);
  };

  return (
    <div className="entregaveis-editor">
      <div className="entregaveis-head">
        <span>Entregáveis</span>
        <Button label="Adicionar entregável" icon="pi pi-plus" className="btn-add-entregavel" type="button" onClick={abrirNovo} />
      </div>

      {entregaveis.length === 0 && <p className="entregaveis-vazio">Nenhum entregável. Adicione acima.</p>}

      <div className="entregaveis-lista">
        {entregaveis.map((e, i) => (
          <button key={e.id ?? `novo-${i}`} type="button" className="entregavel-card" onClick={() => abrirEdicao(i)}>
            <div className="ec-top">
              <span className="ec-formato">{e.formato?.descricao ?? 'Sem formato'}</span>
              <span className={`ec-status ec-status-${e.status.toLowerCase()}`}>{STATUS_ENTREGAVEL_LABEL[e.status]}</span>
            </div>
            {e.escopo && <p className="ec-escopo">{e.escopo}</p>}
            <div className="ec-bottom">
              <span><i className="pi pi-calendar" /> {formatarData(e.dataEntrega)}</span>
              <button type="button" className="ec-remover" onClick={(ev) => { ev.stopPropagation(); remover(i); }} title="Remover"><i className="pi pi-trash" /></button>
            </div>
          </button>
        ))}
      </div>

      <EntregavelDialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        onSave={salvar}
        formatos={formatos}
        inicial={editIndex !== null ? entregaveis[editIndex] : null}
      />
    </div>
  );
}

export default EntregaveisEditor;
