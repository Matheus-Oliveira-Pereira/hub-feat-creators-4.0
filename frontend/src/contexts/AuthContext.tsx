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
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(buildUserFromToken(storedToken));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
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
    const { token: receivedToken, refreshToken } = response.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('refreshToken', refreshToken);
    setToken(receivedToken);
    setUser(buildUserFromToken(receivedToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user, token, isAuthenticated, loading, login, logout,
  }), [user, token, isAuthenticated, loading, login, logout]);

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
