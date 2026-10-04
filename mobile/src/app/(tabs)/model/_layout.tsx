import { Stack } from 'expo-router';

import { useTheme } from '../../../lib/theme';

export default function ModelStack() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: t.bg },
        headerTitleStyle: { color: t.text },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Screening model' }} />
    </Stack>
  );
}
