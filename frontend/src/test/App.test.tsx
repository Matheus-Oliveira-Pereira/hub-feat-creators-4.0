import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import App from '../App';

describe('App', () => {
  it('deve renderizar sem erros', () => {
    render(<App />);
    expect(document.getElementById('root') || document.body).toBeTruthy();
  });
});
