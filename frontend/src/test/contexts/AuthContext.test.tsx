import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  onApiTokenRefreshed: vi.fn(),
}));

import api from '../../services/api';

function createMockToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('estado inicial', () => {
    it('deve iniciar nao autenticado quando nao ha token', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('deve estar com loading false apos inicializacao', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('com token no localStorage', () => {
    it('deve autenticar com token valido e extrair dados do usuario', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hora no futuro
      const token = createMockToken({
        id: '123',
        sub: 'usuario@teste.com',
        nome: 'Usuario Teste',
        roles: ['USRB', 'USRA'],
        exp: futureExp,
      });

      localStorage.setItem('token', token);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual({
        id: '123',
        email: 'usuario@teste.com',
        nome: 'Usuario Teste',
        roles: ['USRB', 'USRA'],
      });
    });

    it('deve remover token expirado e nao autenticar', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hora no passado
      const token = createMockToken({
        id: '123',
        sub: 'usuario@teste.com',
        nome: 'Usuario Teste',
        roles: [],
        exp: pastExp,
      });

      localStorage.setItem('token', token);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('deve lidar com token sem campo exp como expirado', () => {
      const token = createMockToken({
        id: '123',
        sub: 'usuario@teste.com',
        nome: 'Usuario Teste',
        roles: [],
      });

      localStorage.setItem('token', token);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('deve autenticar o usuario apos login bem-sucedido', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createMockToken({
        id: '456',
        sub: 'novo@teste.com',
        nome: 'Novo Usuario',
        roles: ['PRFB'],
        exp: futureExp,
      });

      vi.mocked(api.post).mockResolvedValueOnce({
        data: { token, email: 'novo@teste.com', nome: 'Novo Usuario' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('novo@teste.com', 'senha123');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'novo@teste.com',
        senha: 'senha123',
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe(token);
      expect(result.current.user).toEqual({
        id: '456',
        email: 'novo@teste.com',
        nome: 'Novo Usuario',
        roles: ['PRFB'],
      });
      expect(localStorage.getItem('token')).toBe(token);
    });

    it('deve propagar erro quando login falha', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Credenciais invalidas'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('errado@teste.com', 'senhaerrada');
        })
      ).rejects.toThrow('Credenciais invalidas');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('deve limpar o estado e remover token do localStorage', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createMockToken({
        id: '789',
        sub: 'sair@teste.com',
        nome: 'Usuario Saindo',
        roles: ['USRB'],
        exp: futureExp,
      });

      localStorage.setItem('token', token);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('useAuth fora do provider', () => {
    it('deve lancar erro quando usado fora do AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth deve ser usado dentro de um AuthProvider');
    });
  });
});
