import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TableActions from '../../components/TableActions';

vi.mock('primereact/button', () => ({
  Button: ({ onClick, tooltip, icon, ...props }: any) => (
    <button onClick={onClick} data-testid={`btn-${tooltip?.toLowerCase()}`} data-icon={icon} {...props}>
      {tooltip}
    </button>
  ),
}));

describe('TableActions', () => {
  it('deve renderizar ambos os botoes por padrao', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TableActions onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    expect(screen.getByTestId('btn-excluir')).toBeInTheDocument();
  });

  it('deve esconder o botao de editar quando showEdit e false', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TableActions onEdit={onEdit} onDelete={onDelete} showEdit={false} />);

    expect(screen.queryByTestId('btn-editar')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-excluir')).toBeInTheDocument();
  });

  it('deve esconder o botao de excluir quando showDelete e false', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TableActions onEdit={onEdit} onDelete={onDelete} showDelete={false} />);

    expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-excluir')).not.toBeInTheDocument();
  });

  it('deve retornar null quando ambos showEdit e showDelete sao false', () => {
    const { container } = render(<TableActions showEdit={false} showDelete={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('deve chamar onEdit ao clicar no botao de editar', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TableActions onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId('btn-editar'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onDelete ao clicar no botao de excluir', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TableActions onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId('btn-excluir'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('nao deve renderizar botao de editar sem handler onEdit', () => {
    const onDelete = vi.fn();
    render(<TableActions onDelete={onDelete} />);

    expect(screen.queryByTestId('btn-editar')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-excluir')).toBeInTheDocument();
  });

  it('nao deve renderizar botao de excluir sem handler onDelete', () => {
    const onEdit = vi.fn();
    render(<TableActions onEdit={onEdit} />);

    expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-excluir')).not.toBeInTheDocument();
  });
});
