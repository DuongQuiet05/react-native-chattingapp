import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'auth:accessToken';

export async function saveAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}
