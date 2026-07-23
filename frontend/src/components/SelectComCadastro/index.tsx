import { ReactNode } from 'react';
import './styles.scss';

interface SelectComCadastroProps {
  /** O controle de seleção (Dropdown/MultiSelect) que ocupa a maior parte da linha. */
  children: ReactNode;
  /** Abre o modal de cadastro da entidade referenciada. */
  onAdd: () => void;
  /** Só exibe o botão "+" quando o usuário pode adicionar a entidade referenciada. */
  visivel?: boolean;
  /** Tooltip/aria do botão. Ex: "Cadastrar nova marca". */
  title?: string;
}

/**
 * Envolve um seletor de entidade (Dropdown/MultiSelect) e adiciona um botão "+"
 * ao lado para cadastrar e atribuir um novo registro na hora.
 */
function SelectComCadastro({ children, onAdd, visivel = true, title = 'Cadastrar novo' }: SelectComCadastroProps) {
  return (
    <div className="select-com-cadastro">
      <div className="select-com-cadastro-campo">{children}</div>
      {visivel && (
        <button type="button" className="select-com-cadastro-btn" onClick={onAdd} title={title} aria-label={title}>
          <i className="pi pi-plus" />
        </button>
      )}
    </div>
  );
}

export default SelectComCadastro;
