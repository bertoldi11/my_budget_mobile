import AppTabs from '@/components/app-tabs';

/**
 * Layout das telas autenticadas. A proteção fica no `_layout.tsx` da raiz, via
 * `Stack.Protected`; aqui só ficam as abas.
 */
export default function AppLayout() {
  return <AppTabs />;
}
