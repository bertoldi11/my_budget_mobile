import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loading, user } = useAuth();

  // Enquanto o token guardado é validado, nada é montado: a splash cobre a tela
  // e evita o pisca-pisca do login aparecendo para quem já está logado.
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/*
        Toda tela nova autenticada entra em src/app/(app)/ e já nasce protegida.
        `redirectTo` é explícito nos dois sentidos: sem ele o expo-router manda
        para a âncora do navigator, que aqui é a própria rota protegida.
      */}
      <Stack.Protected guard={user !== null} redirectTo="/login">
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={user === null} redirectTo="/">
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
