import { Stack } from 'expo-router';

import { useTheme } from '../../../lib/theme';

export default function HomeStack() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { color: t.text },
        headerTintColor: t.brand,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Nova' }} />
    </Stack>
  );
}
