import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface Notificacao {
  tipo: string;
  entidade: string;
  mensagem: string;
  usuario: string;
  timestamp: string;
}

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notificacao | null>(null);
  const listenersRef = useRef<Set<(n: Notificacao) => void>>(new Set());

  const subscribe = useCallback((callback: (n: Notificacao) => void) => {
    listenersRef.current.add(callback);
    return () => { listenersRef.current.delete(callback); };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let client: Client;

    try {
      client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 10000,
        connectionTimeout: 5000,
        onConnect: () => {
          setConnected(true);
          client.subscribe('/topic/notificacoes', (message) => {
            try {
              const notificacao: Notificacao = JSON.parse(message.body);
              setLastNotification(notificacao);
              listenersRef.current.forEach((cb) => cb(notificacao));
            } catch { /* ignore parse errors */ }
          });
        },
        onDisconnect: () => setConnected(false),
        onStompError: () => setConnected(false),
        onWebSocketError: () => setConnected(false),
      });

      client.activate();
      clientRef.current = client;
    } catch {
      setConnected(false);
    }

    return () => {
      try {
        clientRef.current?.deactivate();
      } catch { /* ignore cleanup errors */ }
    };
  }, []);

  return { connected, lastNotification, subscribe };
}
