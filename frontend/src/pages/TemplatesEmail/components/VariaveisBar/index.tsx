import { VARIAVEIS_TEMPLATE } from '../../service';
import './styles.scss';

interface Props {
  onInsert: (token: string) => void;
}

function VariaveisBar({ onInsert }: Readonly<Props>) {
  return (
    <div className="variaveis-bar">
      <span className="variaveis-label">Variáveis:</span>
      {VARIAVEIS_TEMPLATE.map((v) => (
        <button key={v.token} type="button" className="variavel-chip" onClick={() => onInsert(v.token)} title={v.token}>
          {v.label}
        </button>
      ))}
    </div>
  );
}

export default VariaveisBar;
