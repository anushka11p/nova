import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { ModelProvider } from '../lib/model';
import { ScreeningsProvider } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const t = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: t.brand, background: t.bg, card: t.card, text: t.text, border: t.border },
  };

  return (
    <ThemeProvider value={navTheme}>
      <ModelProvider>
        <ScreeningsProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTintColor: t.brand, headerTitleStyle: { color: t.text } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="new" options={{ presentation: 'fullScreenModal', title: 'New screening' }} />
            <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="screening/[id]" options={{ title: 'Screening' }} />
          </Stack>
        </ScreeningsProvider>
      </ModelProvider>
    </ThemeProvider>
  );
}
