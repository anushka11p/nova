import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResultPanel } from '../components/result';
import { Button, Card, Icon, SectionHeader } from '../components/ui';
import { EARLY_JAUNDICE_RULE, MODEL_NAME, NEXT_STEPS, trustLine } from '../lib/clinical';
import { analyse, Analysis } from '../lib/inference';
import { useModel } from '../lib/model';
import { keepPhoto, newPatientId, Screening, useScreenings } from '../lib/store';
import { radius, TOUCH, type, useTheme } from '../lib/theme';

const SAMPLES = [
  { label: 'A', module: require('../../assets/samples/sample-a.jpg') },
  { label: 'B', module: require('../../assets/samples/sample-b.jpg') },
  { label: 'C', module: require('../../assets/samples/sample-c.jpg') },
];

type Photo = { uri: string; width: number; height: number };
type Sex = 'Female' | 'Male' | null;

export default function NewScreening() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const model = useModel();
  const { add } = useScreenings();
  const scroll = useRef<ScrollView>(null);

  const [patientId, setPatientId] = useState(newPatientId);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ photo?: string; name?: string; age?: string }>({});
  const [phase, setPhase] = useState<'form' | 'analysing' | 'done'>('form');
  const [result, setResult] = useState<Screening | null>(null);

  async function pick(source: 'camera' | 'library') {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera access needed' : 'Photo access needed',
        `Allow ${source === 'camera' ? 'camera' : 'photo'} access for Nova in Settings to screen a photo.`,
      );
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPhoto({ uri: a.uri, width: a.width, height: a.height });
    setErrors((e) => ({ ...e, photo: undefined }));
  }

  async function pickSample(module: number) {
    const [asset] = await Asset.loadAsync(module);
    setPhoto({ uri: asset.localUri ?? asset.uri, width: asset.width ?? 1000, height: asset.height ?? 1000 });
    setErrors((e) => ({ ...e, photo: undefined }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!photo) e.photo = 'Add a photo of the baby.';
    if (!name.trim()) e.name = 'Enter the baby’s name or identifier.';
    const n = Number(age);
    if (age === '' || !Number.isInteger(n) || n < 0 || n > 28) e.age = 'Enter the age in whole days, 0 to 28.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function run() {
    if (!validate() || !photo) return;
    if (model.state !== 'loaded') {
      Alert.alert('Model not ready', model.state === 'error' ? model.error.message : 'The screening model is still loading. Try again in a moment.');
      return;
    }
    setPhase('analysing');
    try {
      const a: Analysis = await analyse(model.model, photo.uri, photo.width, photo.height);
      const id = `${patientId}-${Date.now()}`;
      const record: Screening = {
        id,
        patientId,
        name: name.trim(),
        ageDays: Number(age),
        gender: sex,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        probability: a.probability,
        threshold: a.threshold,
        risk: a.risk,
        modelUsed: MODEL_NAME,
        ms: a.ms,
        photoUri: keepPhoto(photo.uri, id),
      };
      add(record);
      setResult(record);
      setPhase('done');
      Haptics.notificationAsync(a.risk === 'Normal' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch (err) {
      setPhase('form');
      Alert.alert('Screening failed', (err as Error).message);
    }
  }

  function reset() {
    setPatientId(newPatientId());
    setPhoto(null);
    setName('');
    setAge('');
    setSex(null);
    setNotes('');
    setErrors({});
    setResult(null);
    setPhase('form');
  }

  const close = () => router.back();
  const inputStyle = (error?: string) => ({
    minHeight: TOUCH + 4,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: error ? t.risk.High.solid : t.border,
    backgroundColor: t.input,
    paddingHorizontal: 14,
    color: t.text,
    ...type.body,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: phase === 'done' ? 'Result' : 'New screening',
          headerLeft: () =>
            phase === 'done' ? null : (
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={8} style={{ minHeight: TOUCH, justifyContent: 'center', paddingRight: 8 }}>
                {Platform.OS === 'ios' ? <Text style={[type.body, { color: t.brand }]}>Cancel</Text> : <Icon name="close" size={24} color={t.text} />}
              </Pressable>
            ),
          headerRight: () =>
            phase === 'done' ? (
              <Pressable onPress={close} accessibilityRole="button" hitSlop={8} style={{ minHeight: TOUCH, justifyContent: 'center', paddingLeft: 8 }}>
                <Text style={[type.headline, { color: t.brand }]}>Done</Text>
              </Pressable>
            ) : null,
          gestureEnabled: phase !== 'analysing',
          headerBackVisible: false,
        }}
      />
      <ScrollView
        ref={scroll}
        style={{ backgroundColor: t.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, width: '100%', maxWidth: 640, alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {phase === 'done' && result ? (
          <>
            <Card style={{ padding: 16 }}>
              <ResultPanel risk={result.risk} probability={result.probability} threshold={result.threshold} />
              <Text style={[type.footnote, { color: t.text2, marginTop: 14 }]}>{trustLine()}</Text>
            </Card>

            <SectionHeader title="Next steps" />
            <Card style={{ padding: 16, gap: 12 }}>
              {NEXT_STEPS[result.risk].map((step) => (
                <View key={step} style={{ flexDirection: 'row', gap: 10 }}>
                  <Icon name="check" size={18} color={t.brand} />
                  <Text style={[type.callout, { color: t.text, flex: 1 }]}>{step}</Text>
                </View>
              ))}
              <Text style={[type.footnote, { color: t.text2, borderTopWidth: 1, borderTopColor: t.separator, paddingTop: 12 }]}>{EARLY_JAUNDICE_RULE}</Text>
            </Card>

            <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
              <Image source={{ uri: result.photoUri }} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: t.photoBg }} />
              <View style={{ flex: 1 }}>
                <Text style={[type.headline, { color: t.text }]} numberOfLines={1}>{result.name}</Text>
                <Text style={[type.footnote, { color: t.text2 }]}>Saved to Screenings · analysed in {(result.ms / 1000).toFixed(1)} s</Text>
              </View>
            </Card>

            <View style={{ gap: 10, marginTop: 24 }}>
              <Button label="Screen another baby" icon="camera" onPress={reset} />
              <Button label="Done" variant="tonal" onPress={close} />
            </View>
          </>
        ) : (
          <>
            <SectionHeader title="Photo" aside="Chest and face, neutral light" />
            <Card>
              {photo ? (
                <View>
                  <View style={{ backgroundColor: t.photoBg }}>
                    <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="contain" accessibilityLabel="Photo to be screened" />
                    {phase === 'analysing' ? (
                      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <ActivityIndicator color="#FFFFFF" size="large" />
                        <Text style={[type.headline, { color: '#FFFFFF' }]}>Analysing on this phone…</Text>
                      </View>
                    ) : null}
                  </View>
                  {phase === 'form' ? (
                    <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
                      <Button label="Retake" icon="camera" variant="tonal" onPress={() => pick('camera')} style={{ flex: 1 }} />
                      <Button label="Choose" icon="photo" variant="tonal" onPress={() => pick('library')} style={{ flex: 1 }} />
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={{ padding: 16, gap: 10 }}>
                  <Button label="Take photo" icon="camera" onPress={() => pick('camera')} />
                  <Button label="Choose from library" icon="photo" variant="tonal" onPress={() => pick('library')} />
                  <Text style={[type.footnote, { color: t.text2, marginTop: 4 }]}>
                    Undress to the nappy, use daylight or white light, avoid yellow lamps and shadows.
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <Text style={[type.footnote, { color: t.text3 }]}>Practise with a sample:</Text>
                    {SAMPLES.map((s) => (
                      <Pressable
                        key={s.label}
                        onPress={() => pickSample(s.module)}
                        accessibilityRole="button"
                        accessibilityLabel={`Sample photo ${s.label}`}
                        style={{ minWidth: TOUCH, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: t.brandSoft, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={[type.subhead, { color: t.brand, fontWeight: '600' }]}>{s.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </Card>
            {errors.photo ? <Text style={[type.footnote, { color: t.risk.High.fg, marginTop: 6, marginLeft: 4 }]}>{errors.photo}</Text> : null}

            <SectionHeader title="Baby" aside={patientId} />
            <Card style={{ padding: 16, gap: 16 }}>
              <View>
                <Text style={[type.subhead, { color: t.text, fontWeight: '600', marginBottom: 6 }]}>Name or identifier</Text>
                <TextInput
                  value={name}
                  onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
                  placeholder="e.g. Baby of A. Garcia"
                  placeholderTextColor={t.text3}
                  editable={phase === 'form'}
                  autoCorrect={false}
                  returnKeyType="next"
                  style={inputStyle(errors.name)}
                />
                {errors.name ? <Text style={[type.footnote, { color: t.risk.High.fg, marginTop: 6 }]}>{errors.name}</Text> : null}
              </View>

              <View>
                <Text style={[type.subhead, { color: t.text, fontWeight: '600', marginBottom: 6 }]}>Age in days</Text>
                <TextInput
                  value={age}
                  onChangeText={(v) => { setAge(v.replace(/[^0-9]/g, '')); if (errors.age) setErrors((e) => ({ ...e, age: undefined })); }}
                  placeholder="0 to 28 (day of birth is 0)"
                  placeholderTextColor={t.text3}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={phase === 'form'}
                  style={inputStyle(errors.age)}
                />
                {errors.age ? <Text style={[type.footnote, { color: t.risk.High.fg, marginTop: 6 }]}>{errors.age}</Text> : null}
              </View>

              <View>
                <Text style={[type.subhead, { color: t.text, fontWeight: '600', marginBottom: 6 }]}>Sex</Text>
                <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', borderRadius: radius.control, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
                  {([['Female', 'Female'], ['Male', 'Male'], [null, 'Not recorded']] as [Sex, string][]).map(([value, label], i) => {
                    const on = sex === value;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setSex(value)}
                        disabled={phase !== 'form'}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        style={{ flex: 1, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.brandSoft : t.input, borderLeftWidth: i ? 1 : 0, borderLeftColor: t.border }}
                      >
                        <Text style={[type.subhead, { color: on ? t.brand : t.text2, fontWeight: on ? '600' : '400' }]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={[type.subhead, { color: t.text, fontWeight: '600', marginBottom: 6 }]}>
                  Notes <Text style={{ color: t.text3, fontWeight: '400' }}>(optional)</Text>
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Feeding, TcB reading, anything the reviewer should know"
                  placeholderTextColor={t.text3}
                  multiline
                  editable={phase === 'form'}
                  style={[inputStyle(), { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }]}
                />
              </View>
            </Card>

            <Button
              label={phase === 'analysing' ? 'Analysing…' : 'Analyse photo'}
              icon="stethoscope"
              loading={phase === 'analysing'}
              disabled={model.state === 'error'}
              onPress={run}
              style={{ marginTop: 24 }}
            />
            <Text style={[type.footnote, { color: t.text3, textAlign: 'center', marginTop: 10 }]}>
              {model.state === 'loading' ? 'Loading the screening model…' : 'Runs on this phone. The photo is not uploaded.'}
            </Text>
          </>
        )}
      </ScrollView>
    </>
  );
}
