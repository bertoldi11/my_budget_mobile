import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      {/*
        Ícones do sistema nas três abas — SF Symbols no iOS, Material Symbols no
        Android —, sem arquivo de asset no projeto. Os dois primeiros são os
        mesmos símbolos que o web usa nas mesmas ações (`hero-plus` e
        `hero-arrows-right-left` em ../my_budget).
      */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Nova</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="movements">
        <NativeTabs.Trigger.Label>Movimentações</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="arrow.left.arrow.right"
          md="swap_horiz"
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/*
        "Sair" é uma ação, mas o menu nativo só aceita rotas como itens: a tela
        de (app)/logout.tsx faz o logout ao abrir.
      */}
      <NativeTabs.Trigger name="logout">
        <NativeTabs.Trigger.Label>Sair</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="rectangle.portrait.and.arrow.right"
          md="logout"
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
