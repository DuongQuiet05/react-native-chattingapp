import { Client, type IMessage } from '@stomp/stompjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { WS_BASE_URL } from '@/constants/config';
import { useAuth } from '@/contexts/auth-context';

interface StompContextValue {
  connected: boolean;
  subscribe: (destination: string, callback: (message: IMessage) => void) => () => void;
  publish: (destination: string, body: string, headers?: Record<string, string>) => void;
  // Helper methods cho chat
  sendMessage: (conversationId: number, content: string, messageType?: string) => void;
  sendTypingIndicator: (conversationId: number) => void;
  markAsRead: (messageId: number, conversationId: number) => void;
}

const StompContext = createContext<StompContextValue | undefined>(undefined);

export function StompProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }

      setConnected(false);
      return;
    }

    // Chuyển http:// thành ws:// hoặc wss://
    let wsUrl = WS_BASE_URL.startsWith('http') 
      ? WS_BASE_URL.replace(/^http/, 'ws')
      : WS_BASE_URL;
    
    // Đảm bảo URL không có trailing slash và có đúng endpoint
    wsUrl = wsUrl.replace(/\/$/, '');
    if (!wsUrl.endsWith('/ws')) {
      wsUrl = wsUrl.replace(/\/ws$/, '') + '/ws';
    }
    
    console.log('🔌 [STOMP] Connecting to:', wsUrl);
    
    const client = new Client({
      // Dùng WebSocket thuần, KHÔNG dùng SockJS để tránh CORS
      brokerURL: wsUrl,
      connectHeaders: { 
        Authorization: `Bearer ${token}`,
      },
      // Thêm token vào query params như backup
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (frame) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(`[STOMP] ${frame}`);
        }
      },
      // Thêm onWebSocketError để debug
      onWebSocketError: (event) => {
        console.error('❌ [STOMP] WebSocket error:', event);
      },
      // Thêm onDebug để xem chi tiết
      onDebug: (msg) => {
        if (__DEV__) {
          console.log(`[STOMP DEBUG] ${msg}`);
        }
      },
    });

    client.onConnect = (frame) => {
      console.log('✅ [STOMP] Connected to WebSocket', frame);
      setConnected(true);
    };

    client.onDisconnect = () => {
      console.log('❌ [STOMP] Disconnected from WebSocket');
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('⚠️ [STOMP] Error:', frame.headers['message'], frame.body);
      console.warn('STOMP error headers:', frame.headers);
      setConnected(false);
    };

    client.onWebSocketClose = (event) => {
      console.log('🔌 [STOMP] WebSocket closed', event.code, event.reason);
      setConnected(false);
    };

    try {
      client.activate();
      clientRef.current = client;
      console.log('🚀 [STOMP] Client activated');
    } catch (error) {
      console.error('❌ [STOMP] Failed to activate client:', error);
    }

    return () => {
      setConnected(false);
      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch (error) {
          console.error('❌ [STOMP] Error deactivating:', error);
        }
      }
      clientRef.current = null;
    };
  }, [status, token]);

  const subscribe = useCallback(
    (destination: string, callback: (message: IMessage) => void) => {
      if (!clientRef.current) {
        console.warn('⚠️ [STOMP] Subscribe failed: No client');
        return () => {};
      }

      if (!connected) {
        console.warn('⚠️ [STOMP] Subscribe failed: Not connected');
        return () => {};
      }

      console.log('📡 [STOMP] Subscribing to:', destination);
      const subscription = clientRef.current.subscribe(destination, (message) => {
        console.log('📨 [STOMP] Message received from:', destination);
        callback(message);
      });

      return () => {
        console.log('🔕 [STOMP] Unsubscribing from:', destination);
        subscription.unsubscribe();
      };
    },
    [connected],
  );

  const publish = useCallback(
    (destination: string, body: string, headers?: Record<string, string>) => {
      if (!clientRef.current || !connected) {
        console.warn('STOMP publish attempted without active connection');
        return;
      }

      clientRef.current.publish({ destination, body, headers });
    },
    [connected],
  );

  // Helper: Gửi tin nhắn qua WebSocket
  const sendMessage = useCallback(
    (conversationId: number, content: string, messageType: string = 'TEXT') => {
      console.log('📤 [STOMP] Sending message:', { conversationId, content, messageType });
      publish(
        '/app/chat.send',
        JSON.stringify({
          conversationId,
          content,
          messageType,
        }),
      );
    },
    [publish],
  );

  // Helper: Gửi typing indicator
  const sendTypingIndicator = useCallback(
    (conversationId: number) => {
      publish(
        '/app/chat.typing',
        JSON.stringify({
          conversationId,
        }),
      );
    },
    [publish],
  );

  // Helper: Đánh dấu tin nhắn đã đọc
  const markAsRead = useCallback(
    (messageId: number, conversationId: number) => {
      publish(
        '/app/chat.read',
        JSON.stringify({
          id: messageId,
          conversationId,
        }),
      );
    },
    [publish],
  );

  const value = useMemo<StompContextValue>(
    () => ({ 
      connected, 
      subscribe, 
      publish,
      sendMessage,
      sendTypingIndicator,
      markAsRead,
    }), 
    [connected, publish, subscribe, sendMessage, sendTypingIndicator, markAsRead],
  );

  return <StompContext.Provider value={value}>{children}</StompContext.Provider>;
}

export function useStomp() {
  const context = useContext(StompContext);

  if (!context) {
    throw new Error('useStomp phải được sử dụng bên trong StompProvider');
  }

  return context;
}
