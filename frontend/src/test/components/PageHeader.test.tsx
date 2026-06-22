import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from '../../components/PageHeader';

describe('PageHeader', () => {
  it('deve renderizar o titulo', () => {
    render(<PageHeader title="Usuarios" />);
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });

  it('deve renderizar o titulo em um elemento h1', () => {
    render(<PageHeader title="Perfis" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Perfis');
  });

  it('deve renderizar o subtitulo quando fornecido', () => {
    render(<PageHeader title="Usuarios" subtitle="Gerenciamento de usuarios" />);
    expect(screen.getByText('Gerenciamento de usuarios')).toBeInTheDocument();
  });

  it('nao deve renderizar subtitulo quando nao fornecido', () => {
    const { container } = render(<PageHeader title="Usuarios" />);
    const paragraph = container.querySelector('p');
    expect(paragraph).toBeNull();
  });

  it('deve ter a classe page-header no container', () => {
    const { container } = render(<PageHeader title="Teste" />);
    expect(container.querySelector('.page-header')).toBeInTheDocument();
  });
});
