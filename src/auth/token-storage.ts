import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'my_budget.api_token';

/**
 * Guarda o token de API.
 *
 * No nativo usa o Keychain (iOS) / Keystore (Android) via expo-secure-store.
 * No web o expo-secure-store não existe, então cai para `localStorage` — que é
 * legível por qualquer script da página; aceitável para desenvolvimento, mas
 * revise antes de publicar o app web.
 */
export const tokenStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(KEY);
    }
    return SecureStore.getItemAsync(KEY);
  },

  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(KEY, token);
      return;
    }
    await SecureStore.setItemAsync(KEY, token);
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};
