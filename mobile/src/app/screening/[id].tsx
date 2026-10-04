import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResultPanel } from '../../components/result';
import { Button, Card, EmptyState, Icon, Row, SectionHeader } from '../../components/ui';
import { EARLY_JAUNDICE_RULE, formatAge, NEXT_STEPS, trustLine } from '../../lib/clinical';
import { useScreenings } from '../../lib/store';
import { type, useTheme } from '../../lib/theme';

export default function ScreeningDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get, remove } = useScreenings();
  const s = get(id);

  if (!s) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <Stack.Screen options={{ title: 'Screening' }} />
        <EmptyState icon="info" title="Screening not found" body="It may have been deleted." />
      </View>
    );
  }

  const when = new Date(s.createdAt);
  const details: [string, string][] = [
    ['Screening ID', s.patientId],
    ['Age', formatAge(s.ageDays)],
    ['Sex', s.gender ?? 'Not recorded'],
    ['Screened', `${when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}, ${when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`],
    ['Model', s.modelUsed],
    ['Analysis time', `${(s.ms / 1000).toFixed(1)} s`],
  ];

  function confirmDelete() {
    Alert.alert('Delete this screening?', `${s!.name}’s result and photo will be removed from this phone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          remove(s!.id);
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: s.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: t.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, width: '100%', maxWidth: 640, alignSelf: 'center' }}
      >
        <Card>
          <View style={{ backgroundColor: t.photoBg }}>
            <Image source={{ uri: s.photoUri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="contain" accessibilityLabel={`Photo of ${s.name} used for this screening`} />
          </View>
          <View style={{ padding: 16 }}>
            <ResultPanel risk={s.risk} probability={s.probability} threshold={s.threshold} />
            <Text style={[type.footnote, { color: t.text2, marginTop: 14 }]}>{trustLine()}</Text>
          </View>
        </Card>

        <SectionHeader title="Next steps" />
        <Card style={{ padding: 16, gap: 12 }}>
          {NEXT_STEPS[s.risk].map((step) => (
            <View key={step} style={{ flexDirection: 'row', gap: 10 }}>
              <Icon name="check" size={18} color={t.brand} />
              <Text style={[type.callout, { color: t.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
          <Text style={[type.footnote, { color: t.text2, borderTopWidth: 1, borderTopColor: t.separator, paddingTop: 12 }]}>{EARLY_JAUNDICE_RULE}</Text>
        </Card>

        <SectionHeader title="Details" />
        <Card>
          {details.map(([k, v], i) => (
            <Row key={k} last={i === details.length - 1}>
              <Text style={[type.callout, { color: t.text2 }]}>{k}</Text>
              <Text style={[type.callout, { color: t.text, flex: 1, textAlign: 'right' }]} numberOfLines={2}>{v}</Text>
            </Row>
          ))}
        </Card>

        {s.notes ? (
          <>
            <SectionHeader title="Notes" />
            <Card style={{ padding: 16 }}>
              <Text style={[type.callout, { color: t.text }]}>{s.notes}</Text>
            </Card>
          </>
        ) : null}

        <Text style={[type.footnote, { color: t.text3, marginTop: 16, marginHorizontal: 4 }]}>
          If the photo is dark, blurred or lit by a yellow lamp, screen again with a better photo.
        </Text>

        <Button label="Delete screening" icon="trash" variant="plain" onPress={confirmDelete} style={{ marginTop: 16 }} />
      </ScrollView>
    </>
  );
}
