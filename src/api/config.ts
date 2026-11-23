import { Platform } from 'react-native';

/**
 * Servidor de desenvolvimento do Phoenix, quando `EXPO_PUBLIC_API_URL` não foi
 * definida. `localhost` só funciona no emulador/navegador da mesma máquina: no
 * emulador Android o host é 10.0.2.2, e num aparelho físico é o IP da máquina
 * na rede (ver `.env.example`).
 */
const DEV_FALLBACK = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

/**
 * URL base da API do projeto ../my_budget.
 *
 * Em produção vem de `EXPO_PUBLIC_API_URL`, embutida no bundle em build time
 * pelo `.env.production` ou pelo campo `env` do perfil em eas.json. Sem ela,
 * um build de produção falha aqui de propósito: cair no localhost geraria
 * "não foi possível conectar" em todas as telas, escondendo um erro de build.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;

  if (configured) return configured.replace(/\/+$/, '');

  if (__DEV__) return DEV_FALLBACK;

  throw new Error(
    'EXPO_PUBLIC_API_URL não foi definida neste build. Defina em .env.production ' +
      'ou no campo `env` do perfil em eas.json.'
  );
}

export const API_URL = resolveApiUrl();
