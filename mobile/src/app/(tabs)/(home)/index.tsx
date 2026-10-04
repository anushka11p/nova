import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { DailyChart } from '../../../components/chart';
import { ScreeningRow } from '../../../components/rows';
import { Button, Card, EmptyState, Icon, IconName, SectionHeader } from '../../../components/ui';
import { MODEL, pct } from '../../../lib/clinical';
import { useModel } from '../../../lib/model';
import { localDayKey, useScreenings } from '../../../lib/store';
import { TOUCH, type, useTheme } from '../../../lib/theme';

function greeting(now: number) {
  const h = new Date(now).getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function Stat({ label, value, hint, icon, tone }: { label: string; value: string; hint: string; icon: IconName; tone: string }) {
  const t = useTheme();
  return (
    <Card style={{ padding: 14, flexGrow: 1, flexBasis: '45%' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={[type.footnote, { color: t.text2, fontWeight: '500', flex: 1 }]}>{label}</Text>
        <Icon name={icon} size={16} color={tone} />
      </View>
      <Text style={[type.stat, { color: t.text, marginTop: 6 }]}>{value}</Text>
      <Text style={[type.caption, { color: t.text3, marginTop: 2 }]} numberOfLines={1}>{hint}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const model = useModel();
  const { screenings, ready, welcomeSeen } = useScreenings();
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  // First open: show the welcome screen once.
  const shownWelcome = useRef(false);
  useEffect(() => {
    if (ready && !welcomeSeen && !shownWelcome.current) {
      shownWelcome.current = true;
      router.push('/welcome');
    }
  }, [ready, welcomeSeen]);

  const { today, followUp } = useMemo(() => {
    const todayKey = localDayKey(new Date(now));
    return {
      today: screenings.filter((s) => localDayKey(new Date(s.createdAt)) === todayKey),
      followUp: screenings.filter((s) => s.risk !== 'Normal' && new Date(s.createdAt).getTime() >= now - 48 * 3600e3),
    };
  }, [screenings, now]);

  const high = today.filter((s) => s.risk === 'High').length;
  const borderline = today.filter((s) => s.risk === 'Moderate').length;
  const dateLine = new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, width: '100%', maxWidth: 720, alignSelf: 'center' }}
    >
      <Text style={[type.title, { color: t.text }]}>{greeting(now)}</Text>
      <Text style={[type.callout, { color: t.text2, marginTop: 2 }]}>{dateLine}</Text>

      <Pressable
        onPress={() => router.push('/new')}
        accessibilityRole="button"
        accessibilityLabel="New screening"
        android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
        style={({ pressed }) => ({
          marginTop: 16,
          borderRadius: 16,
          backgroundColor: t.brand,
          padding: 16,
          minHeight: TOUCH + 28,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          overflow: 'hidden',
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera" size={22} color={t.onBrand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: t.onBrand }]}>New screening</Text>
          <Text style={[type.footnote, { color: t.onBrand, opacity: 0.85 }]}>Photo to result in under a minute</Text>
        </View>
        <Icon name="chevron" size={16} color={t.onBrand} />
      </Pressable>

      {model.state === 'error' ? (
        <View style={{ backgroundColor: t.risk.High.bg, borderColor: t.risk.High.border, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 }}>
          <Text style={[type.subhead, { color: t.risk.High.fg, fontWeight: '600' }]}>The screening model could not load</Text>
          <Text style={[type.footnote, { color: t.text }]}>{model.error.message}</Text>
        </View>
      ) : null}

      <SectionHeader title="Today" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat label="Screened today" value={String(today.length)} hint={`${screenings.length} on this phone`} icon="list" tone={t.brand} />
        <Stat label="High risk" value={String(high)} hint="Need a bilirubin check" icon="high" tone={t.risk.High.solid} />
        <Stat label="Borderline" value={String(borderline)} hint="Retake photo or check" icon="moderate" tone={t.risk.Moderate.solid} />
        <Stat label="Model sensitivity" value={pct(MODEL.test.sensitivity, 1)} hint={`On ${MODEL.test.n} test photos`} icon="gauge" tone={t.text2} />
      </View>

      {!ready ? null : screenings.length === 0 ? (
        <Card style={{ marginTop: 24 }}>
          <EmptyState
            icon="stethoscope"
            title="No screenings yet"
            body="Your screenings, follow-ups and daily activity appear here. Try a sample photo to see how it works."
            action={<Button label="Start a screening" icon="camera" onPress={() => router.push('/new')} />}
          />
        </Card>
      ) : (
        <>
          <SectionHeader title="Needs follow-up" aside={followUp.length ? `${followUp.length} in 48 hours` : 'Last 48 hours'} />
          {followUp.length ? (
            <Card>{followUp.slice(0, 5).map((s, i, a) => <ScreeningRow key={s.id} s={s} withDay last={i === a.length - 1} />)}</Card>
          ) : (
            <Card style={{ padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icon name="normal" size={18} color={t.risk.Normal.solid} />
              <Text style={[type.callout, { color: t.text2, flex: 1 }]}>No babies flagged in the last 48 hours.</Text>
            </Card>
          )}

          <SectionHeader title="Screenings" aside="Last 14 days" />
          <Card style={{ padding: 16 }}>
            <DailyChart screenings={screenings} now={now} />
          </Card>

          <SectionHeader title="Recent" action={{ label: 'See all', onPress: () => router.navigate('/screenings') }} />
          <Card>{screenings.slice(0, 5).map((s, i, a) => <ScreeningRow key={s.id} s={s} withDay last={i === a.length - 1} />)}</Card>
        </>
      )}
    </ScrollView>
  );
}
