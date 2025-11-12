import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useRegisterDevice, useUnregisterDevice } from '@/hooks/api/use-devices';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextValue {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const registerDevice = useRegisterDevice();
  const unregisterDevice = useUnregisterDevice();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listener for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification type
      if (data?.type === 'MESSAGE' && data?.conversationId) {
        // Navigate to conversation
        // router.push(`/chat/${data.conversationId}`);
      } else if (data?.type === 'FRIEND_REQUEST') {
        // Navigate to friend requests
        // router.push('/(tabs)/friend-requests');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        // Subscription object có method remove() để unsubscribe
        responseListener.current.remove();
      }
    };
  }, []);

  // Use refs to track previous values and prevent multiple calls
  const previousStatusRef = useRef<'loading' | 'unauthenticated' | 'authenticated' | undefined>(undefined);
  const hasRegisteredRef = useRef(false);
  const hasUnregisteredRef = useRef(false);

  // Register device token with backend when authenticated
  useEffect(() => {
    if (status === 'authenticated' && user?.id && expoPushToken && !hasRegisteredRef.current) {
      hasRegisteredRef.current = true;
      hasUnregisteredRef.current = false;
      const deviceId = getDeviceId();
      const deviceType = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      
      registerDevice.mutate({
        fcmToken: expoPushToken,
        deviceId: deviceId,
        deviceType: deviceType,
        appVersion: Constants.expoConfig?.version || '1.0.0',
      }, {
        onSuccess: () => {
          // Device registered with backend
        },
        onError: (error) => {
          hasRegisteredRef.current = false; // Allow retry on error
        },
      });
    } else if (status !== 'authenticated') {
      // Reset flags when not authenticated
      hasRegisteredRef.current = false;
    }
  }, [status, user?.id, expoPushToken, registerDevice]);

  // Unregister device on logout (separate effect to avoid infinite loops)
  useEffect(() => {
    // Only unregister when transitioning from authenticated to unauthenticated
    const wasAuthenticated = previousStatusRef.current === 'authenticated';
    const isNowUnauthenticated = status !== 'authenticated';

    if (wasAuthenticated && isNowUnauthenticated && expoPushToken && !hasUnregisteredRef.current) {
      hasUnregisteredRef.current = true;
      hasRegisteredRef.current = false; // Reset registration flag
      const deviceId = getDeviceId();
      unregisterDevice.mutate(deviceId, {
        onSuccess: () => {
          // Device unregistered
        },
        onError: (error) => {
          hasUnregisteredRef.current = false; // Allow retry on error
        },
      });
    }

    // Update the ref for next render
    previousStatusRef.current = status;
  }, [status, expoPushToken, unregisterDevice]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }
    
    try {
      // Thử lấy projectId từ nhiều nguồn
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId ?? 
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.projectId;
      
      if (!projectId) {
        // Nếu không có projectId, return null
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      // Không throw error để app vẫn chạy được
      token = null;
    }
  }

  return token;
}

function getDeviceId(): string {
  // Generate a unique device ID
  // For Expo, we can use Constants.installationId or create a persistent ID
  const deviceId = Constants.installationId || `device_${Date.now()}_${Math.random()}`;
  return deviceId;
}

