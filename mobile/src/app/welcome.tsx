import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, IconName } from '../components/ui';
import { MODEL, pct } from '../lib/clinical';
import { useScreenings } from '../lib/store';
import { type, useTheme } from '../lib/theme';

export default function Welcome() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { markWelcomeSeen } = useScreenings();
  const m = MODEL.test;

  const points: [IconName, string, string][] = [
    ['camera', 'Photo to result in under a minute', 'Photograph the baby, add age and name, and get High risk, Borderline or Normal with clear next steps.'],
    ['lock', 'Private and offline', 'The model runs on this phone. Photos and results never leave it.'],
    ['gauge', 'Honest about its accuracy', `On ${m.n} test photos it caught ${pct(m.sensitivity, 1)} of jaundice and cleared ${pct(m.specificity, 1)} of normal babies.`],
  ];

  function finish(next: 'home' | 'screen') {
    markWelcomeSeen();
    if (next === 'screen') router.replace('/new');
    else router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: 24, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: t.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sun" size={34} color={t.onBrand} />
        </View>
        <Text style={[type.largeTitle, { color: t.text, marginTop: 24 }]} accessibilityRole="header">Nova</Text>
        <Text style={[type.title, { color: t.text, marginTop: 4 }]}>Neonatal jaundice screening</Text>
        <Text style={[type.body, { color: t.text2, marginTop: 10 }]}>Healthy beginnings, powered by AI. A quick photo screen for the newborn check, built for nurses and doctors.</Text>

        <View style={{ marginTop: 32, gap: 22 }}>
          {points.map(([icon, title, body]) => (
            <View key={title} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={20} color={t.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.headline, { color: t.text }]}>{title}</Text>
                <Text style={[type.callout, { color: t.text2, marginTop: 2 }]}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 28, borderRadius: 12, borderWidth: 1, borderColor: t.risk.Moderate.border, backgroundColor: t.risk.Moderate.bg, padding: 14, flexDirection: 'row', gap: 10 }}>
          <Icon name="info" size={18} color={t.risk.Moderate.fg} />
          <Text style={[type.footnote, { color: t.text, flex: 1 }]}>
            Nova is a screening aid, not a diagnosis. It does not replace a bilirubin measurement or a clinician’s assessment.
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 16, gap: 10, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <Button label="Start a screening" icon="camera" onPress={() => finish('screen')} />
        <Button label="Go to home" variant="tonal" onPress={() => finish('home')} />
      </View>
    </View>
  );
}
