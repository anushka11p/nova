import { Tabs } from 'expo-router';

import { Icon } from '../../components/ui';
import { useTheme } from '../../lib/theme';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: t.brand, tabBarInactiveTintColor: t.text3 }}>
      <Tabs.Screen
        name="(home)"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="screenings"
        options={{ title: 'Screenings', tabBarIcon: ({ color }) => <Icon name="list" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="model"
        options={{ title: 'Model', tabBarIcon: ({ color }) => <Icon name="gauge" size={24} color={color} /> }}
      />
    </Tabs>
  );
}
