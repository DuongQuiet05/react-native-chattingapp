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
  const isMountedRef = useRef(true);
  const isAuthenticatedRef = useRef(false);
  const [connected, setConnected] = useState(false);

  // Update refs when status changes
  useEffect(() => {
    isAuthenticatedRef.current = status === 'authenticated' && !!token;
  }, [status, token]);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      // When logging out, deactivate client but DON'T update state to prevent infinite loops
      // The state will remain false (or be set by the effect when re-authenticating)
      if (clientRef.current) {
        const currentClient = clientRef.current;
        clientRef.current = null; // Clear ref first to prevent callbacks from updating state
        try {
          currentClient.deactivate();
        } catch (error) {
          // Error deactivating
        }
      }
      // DO NOT call setConnected(false) here - it will trigger re-render and cause loop
      // Only update state when actually connecting
      return;
    }

    // Only update connected state when transitioning from not authenticated to authenticated
    if (!isAuthenticatedRef.current) {
      setConnected(false);
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
        // Debug logging disabled
      },
      // Thêm onWebSocketError để debug
      onWebSocketError: (event) => {
        // WebSocket error
      },
      // Thêm onDebug để xem chi tiết
      onDebug: (msg) => {
        // Debug logging disabled
      },
    });

    // Store client reference and status to check if it's still active
    const currentClientRef = { current: client };
    const currentStatusRef = { current: status };
    const isActiveRef = { current: true }; // Ref flag to track if this client instance is still active

    // Helper function to safely update state only if client is still active
    const safeSetConnected = (value: boolean) => {
      if (
        isActiveRef.current &&
        isAuthenticatedRef.current &&
        currentStatusRef.current === 'authenticated' &&
        clientRef.current === client &&
        currentClientRef.current === client
      ) {
        setConnected(value);
      }
    };

    client.onConnect = (frame) => {
      if (isActiveRef.current && clientRef.current === client) {
        safeSetConnected(true);
      }
    };

    client.onDisconnect = () => {
      if (isActiveRef.current && clientRef.current === client) {
        safeSetConnected(false);
      }
    };

    client.onStompError = (frame) => {
      if (isActiveRef.current && clientRef.current === client) {
        safeSetConnected(false);
      }
    };

    client.onWebSocketClose = (event) => {
      if (isActiveRef.current && clientRef.current === client) {
        safeSetConnected(false);
      }
    };

    try {
      client.activate();
      clientRef.current = client;
    } catch (error) {
      // Failed to activate client
    }

    return () => {
      // Mark client as inactive IMMEDIATELY to prevent callbacks from updating state
      isActiveRef.current = false;
      currentClientRef.current = null;
      
      // Cleanup: deactivate client but DON'T update state
      // This prevents infinite loops when status changes
      if (clientRef.current === client) {
        const currentClient = clientRef.current;
        clientRef.current = null; // Clear ref first to prevent callbacks from updating state
        try {
          currentClient.deactivate();
        } catch (error) {
          // Error deactivating
        }
      }
    };
  }, [status, token]);

  const subscribe = useCallback(
    (destination: string, callback: (message: IMessage) => void) => {
      if (!clientRef.current) {
        return () => {};
      }

      if (!connected) {
        return () => {};
      }

      const subscription = clientRef.current.subscribe(destination, (message) => {
        callback(message);
      });

      return () => {
        subscription.unsubscribe();
      };
    },
    [connected],
  );

  const publish = useCallback(
    (destination: string, body: string, headers?: Record<string, string>) => {
      if (!clientRef.current || !connected) {
        return;
      }

      clientRef.current.publish({ destination, body, headers });
    },
    [connected],
  );

  // Helper: Gửi tin nhắn qua WebSocket
  const sendMessage = useCallback(
    (conversationId: number, content: string, messageType: string = 'TEXT') => {
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
