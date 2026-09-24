import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MODEL_NAME, RiskLevel, screen, ScreeningResult, THRESHOLD } from './src/screening';

const light = {
  bg: '#F5F9FC', card: '#FFFFFF', text: '#0F1B2D', muted: '#5B6B80', border: '#E2E9F1',
  primary: '#0E7C86', primaryText: '#FFFFFF',
  Normal: { fg: '#11693A', bg: '#E4F6EA' },
  Moderate: { fg: '#8A5A00', bg: '#FFF3D6' },
  High: { fg: '#B42318', bg: '#FDE7E5' },
};
const dark: typeof light = {
  bg: '#0B1320', card: '#131E2E', text: '#E8EEF6', muted: '#9AA9BC', border: '#22324A',
  primary: '#2BB3BE', primaryText: '#04131A',
  Normal: { fg: '#7BE0A2', bg: '#123524' },
  Moderate: { fg: '#FFCF6B', bg: '#3A2C08' },
  High: { fg: '#FF9C92', bg: '#3E1612' },
};

const RISK_ICON: Record<RiskLevel, string> = { Normal: '✓', Moderate: '!', High: '⚠' };

interface Photo { uri: string; width: number; height: number }

export default function App() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  );
}

function Screen() {
  const c = useColorScheme() === 'dark' ? dark : light;
  const s = styles(c);
  const tflite = useTensorflowModel(require('./assets/model/nova_jaundice.tflite'), []);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(source: 'camera' | 'library') {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', `Allow ${source === 'camera' ? 'camera' : 'photo'} access in Settings to screen a photo.`);
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const p = { uri: a.uri, width: a.width, height: a.height };
    setPhoto(p);
    setResult(null);
    await analyse(p);
  }

  async function analyse(p: Photo) {
    if (tflite.state !== 'loaded') return;
    setBusy(true);
    try {
      setResult(await screen(tflite.model, p.uri, p.width, p.height));
    } catch (e) {
      Alert.alert('Screening failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const ready = tflite.state === 'loaded';

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.brand}>Nova</Text>
        <Text style={s.tagline}>Neonatal jaundice screening, on this device</Text>

        <View style={s.card}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={s.photo} accessibilityLabel="Selected newborn photo" />
          ) : (
            <View style={[s.photo, s.placeholder]}>
              <Text style={s.muted}>Photograph the baby's chest, abdomen and face in natural daylight.</Text>
            </View>
          )}

          <View style={s.row}>
            <Button label="Take photo" onPress={() => pick('camera')} disabled={!ready || busy} c={c} primary />
            <Button label="Choose photo" onPress={() => pick('library')} disabled={!ready || busy} c={c} />
          </View>

          {tflite.state === 'loading' && <Text style={s.muted}>Loading model…</Text>}
          {tflite.state === 'error' && <Text style={[s.muted, { color: c.High.fg }]}>Model failed to load: {tflite.error.message}</Text>}
        </View>

        {busy && (
          <View style={[s.card, s.center]}>
            <ActivityIndicator color={c.primary} />
            <Text style={s.muted}>Analysing…</Text>
          </View>
        )}

        {result && !busy && (
          <View style={[s.card, { borderColor: c[result.risk].fg }]}>
            <View style={[s.badge, { backgroundColor: c[result.risk].bg }]}>
              <Text style={[s.badgeText, { color: c[result.risk].fg }]}>
                {RISK_ICON[result.risk]}  {result.risk === 'High' ? 'High risk' : result.risk === 'Moderate' ? 'Moderate risk' : 'Normal'}
              </Text>
            </View>
            <Text style={s.headline}>{result.headline}</Text>

            <Text style={s.label}>Jaundice likelihood</Text>
            <View style={s.meter}>
              <View style={[s.meterFill, { width: `${Math.round(result.probability * 100)}%`, backgroundColor: c[result.risk].fg }]} />
              <View style={[s.meterMark, { left: `${THRESHOLD * 100}%` }]} />
            </View>
            <Text style={s.value}>{(result.probability * 100).toFixed(1)}%  <Text style={s.muted}>(flag at ≥ {Math.round(THRESHOLD * 100)}%)</Text></Text>

            <Text style={s.label}>Recommendation</Text>
            <Text style={s.body}>{result.recommendation}</Text>

            <Text style={[s.muted, { marginTop: 12 }]}>{MODEL_NAME} · {result.ms} ms · offline</Text>
          </View>
        )}

        <Text style={s.disclaimer}>
          Screening aid for research and education only. It does not replace a bilirubin test or a clinician's assessment.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Button({ label, onPress, disabled, primary, c }: {
  label: string; onPress: () => void; disabled?: boolean; primary?: boolean; c: typeof light;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{
        flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: primary ? c.primary : 'transparent', borderWidth: primary ? 0 : 1.5, borderColor: c.primary,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      }]}
    >
      <Text style={{ color: primary ? c.primaryText : c.primary, fontWeight: '600', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

const styles = (c: typeof light) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  brand: { fontSize: 32, fontWeight: '800', color: c.primary, marginTop: 8 },
  tagline: { fontSize: 15, color: c.muted, marginTop: -12 },
  card: { backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: c.border },
  center: { alignItems: 'center' },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  placeholder: { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border },
  row: { flexDirection: 'row', gap: 12 },
  muted: { color: c.muted, fontSize: 14, textAlign: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: '700', fontSize: 14 },
  headline: { fontSize: 20, fontWeight: '700', color: c.text },
  label: { fontSize: 13, fontWeight: '600', color: c.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  meter: { height: 10, borderRadius: 5, backgroundColor: c.border, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 5 },
  meterMark: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: c.text },
  value: { fontSize: 18, fontWeight: '700', color: c.text },
  body: { fontSize: 16, lineHeight: 22, color: c.text },
  disclaimer: { fontSize: 12, color: c.muted, textAlign: 'center', lineHeight: 18 },
});
