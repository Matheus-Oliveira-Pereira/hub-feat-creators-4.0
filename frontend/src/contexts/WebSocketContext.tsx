import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useWebSocket, Notificacao } from '../utils/useWebSocket';

interface WebSocketContextType {
  connected: boolean;
  lastNotification: Notificacao | null;
  subscribe: (callback: (n: Notificacao) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket();
  const value = useMemo(() => ws, [ws]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useNotificacoes(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useNotificacoes deve ser usado dentro de WebSocketProvider');
  return context;
}

export type { Notificacao };
