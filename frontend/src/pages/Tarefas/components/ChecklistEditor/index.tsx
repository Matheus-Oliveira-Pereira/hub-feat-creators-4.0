import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ChecklistItem } from '../../service';

interface Props {
  itens: ChecklistItem[];
  onChange: (itens: ChecklistItem[]) => void;
}

function ChecklistEditor({ itens, onChange }: Readonly<Props>) {
  const patch = (i: number, p: Partial<ChecklistItem>) =>
    onChange(itens.map((c, idx) => (idx === i ? { ...c, ...p } : c)));

  const adicionar = () => onChange([...itens, { descricao: '', concluido: false }]);
  const remover = (i: number) => onChange(itens.filter((_, idx) => idx !== i));

  return (
    <div className="checklist-editor">
      <div className="checklist-head">
        <span>Checklist</span>
        <Button label="Adicionar item" icon="pi pi-plus" className="btn-add-item" type="button" onClick={adicionar} />
      </div>

      {itens.length === 0 && <p className="checklist-vazio">Nenhum item. Adicione acima.</p>}

      {itens.map((item, i) => (
        <div key={item.id ?? `novo-${i}`} className="checklist-linha">
          <Checkbox checked={item.concluido} onChange={(e) => patch(i, { concluido: !!e.checked })} />
          <InputText
            value={item.descricao}
            onChange={(e) => patch(i, { descricao: e.target.value })}
            placeholder="Descrição do item"
            className={`checklist-in ${item.concluido ? 'concluido' : ''}`}
          />
          <button type="button" className="checklist-remover" onClick={() => remover(i)} title="Remover">
            <i className="pi pi-trash" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ChecklistEditor;
