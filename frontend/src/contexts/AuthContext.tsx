import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import api, { onApiTokenRefreshed } from '../services/api';

interface User {
  id: string;
  email: string;
  nome: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  ultimoLogin: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  email: string;
  nome: string;
  ultimoLogin: string | null;
}

interface DecodedToken {
  sub?: string;
  id?: string;
  nome?: string;
  roles?: string[];
  exp?: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

function buildUserFromToken(token: string): User | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    id: decoded.id || '',
    email: decoded.sub || '',
    nome: decoded.nome || '',
    roles: decoded.roles || [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ultimoLogin, setUltimoLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(buildUserFromToken(storedToken));
      setUltimoLogin(localStorage.getItem('ultimoLogin'));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('ultimoLogin');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    onApiTokenRefreshed((newToken) => {
      setToken(newToken);
      setUser(buildUserFromToken(newToken));
    });
    return () => onApiTokenRefreshed(null);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, senha });
    const { token: receivedToken, refreshToken, ultimoLogin: recebidoUltimoLogin } = response.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (recebidoUltimoLogin) {
      localStorage.setItem('ultimoLogin', recebidoUltimoLogin);
    } else {
      localStorage.removeItem('ultimoLogin');
    }
    setToken(receivedToken);
    setUser(buildUserFromToken(receivedToken));
    setUltimoLogin(recebidoUltimoLogin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('ultimoLogin');
    setToken(null);
    setUser(null);
    setUltimoLogin(null);
  }, []);

  // Desloga proativamente quando o token expira com a aba aberta e ociosa (sem nenhuma
  // chamada de API pra disparar o refresh reativo do interceptor).
  useEffect(() => {
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded?.exp) return;
    const msAteExpirar = decoded.exp * 1000 - Date.now();
    if (msAteExpirar <= 0) return;
    const timer = setTimeout(() => logout(), msAteExpirar);
    return () => clearTimeout(timer);
  }, [token, logout]);

  const value = useMemo(() => ({
    user, token, ultimoLogin, isAuthenticated, loading, login, logout,
  }), [user, token, ultimoLogin, isAuthenticated, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export default AuthContext;
