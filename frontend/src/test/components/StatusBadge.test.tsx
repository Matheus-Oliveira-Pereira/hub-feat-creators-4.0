import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('deve renderizar com classe status-ativo quando status e ATIVO', () => {
    render(<StatusBadge status="ATIVO" />);
    const badge = screen.getByText('ATIVO');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge');
    expect(badge).toHaveClass('status-ativo');
  });

  it('deve renderizar com classe status-inativo quando status e INATIVO', () => {
    render(<StatusBadge status="INATIVO" />);
    const badge = screen.getByText('INATIVO');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-badge');
    expect(badge).toHaveClass('status-inativo');
  });

  it('deve renderizar com classe status-inativo para status desconhecido', () => {
    render(<StatusBadge status="OUTRO" />);
    const badge = screen.getByText('OUTRO');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('status-inativo');
  });

  it('deve exibir o texto do status', () => {
    render(<StatusBadge status="ATIVO" />);
    expect(screen.getByText('ATIVO')).toBeInTheDocument();
  });
});
