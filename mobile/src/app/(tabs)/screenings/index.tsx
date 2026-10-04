import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { dayLabel, ScreeningRow } from '../../../components/rows';
import { Button, Card, EmptyState, Icon, SectionHeader } from '../../../components/ui';
import { RiskKey } from '../../../lib/clinical';
import { localDayKey, Screening, useScreenings } from '../../../lib/store';
import { radius, TOUCH, type, useTheme } from '../../../lib/theme';

const openNew = () => router.push('/new');
type Filter = 'All' | RiskKey;
const FILTERS: [Filter, string][] = [['All', 'All'], ['High', 'High risk'], ['Moderate', 'Borderline'], ['Normal', 'Normal']];

export default function ScreeningsScreen() {
  const t = useTheme();
  const { screenings, ready } = useScreenings();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const q = query.trim().toLowerCase();
  const shown = screenings.filter(
    (s) => (filter === 'All' || s.risk === filter) && (!q || s.name.toLowerCase().includes(q) || s.patientId.toLowerCase().includes(q)),
  );
  const days = useMemo(() => {
    const byDay = new Map<string, Screening[]>();
    for (const s of shown) {
      const k = localDayKey(new Date(s.createdAt));
      byDay.set(k, [...(byDay.get(k) ?? []), s]);
    }
    return [...byDay.entries()];
  }, [shown]);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight:
            Platform.OS === 'ios'
              ? () => (
                  <Pressable onPress={openNew} accessibilityRole="button" accessibilityLabel="New screening" hitSlop={8} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="plus" size={22} color={t.brand} />
                  </Pressable>
                )
              : undefined,
          headerSearchBarOptions: screenings.length
            ? { placeholder: 'Search name or ID', onChangeText: (e) => setQuery(e.nativeEvent.text), hideWhenScrolling: false }
            : undefined,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: t.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, width: '100%', maxWidth: 720, alignSelf: 'center' }}
        keyboardDismissMode="on-drag"
      >
        {!ready ? null : screenings.length === 0 ? (
          <EmptyState
            icon="stethoscope"
            title="No screenings yet"
            body="Every screening is saved here with its photo and result, newest first. Photos never leave this phone."
            action={<Button label="Start a screening" icon="camera" onPress={openNew} />}
          />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {FILTERS.map(([value, label]) => {
                const on = filter === value;
                const count = value === 'All' ? screenings.length : screenings.filter((s) => s.risk === value).length;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setFilter(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={{
                      minHeight: 36,
                      paddingHorizontal: 14,
                      borderRadius: Platform.OS === 'android' ? radius.chip : 999,
                      borderWidth: 1,
                      borderColor: on ? t.brand : t.border,
                      backgroundColor: on ? t.brandSoft : t.card,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text style={[type.subhead, { color: on ? t.brand : t.text2, fontWeight: on ? '600' : '500' }]}>{label}</Text>
                    <Text style={[type.caption, { color: on ? t.brand : t.text3, fontVariant: ['tabular-nums'] }]}>{count}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {days.length === 0 ? (
              <Text style={[type.callout, { color: t.text2, textAlign: 'center', marginTop: 32 }]}>
                No screenings match{q ? ` “${query}”` : ''}{filter !== 'All' ? ' with this result' : ''}.
              </Text>
            ) : (
              days.map(([key, list]) => (
                <View key={key}>
                  <SectionHeader title={dayLabel(key)} aside={`${list.length} ${list.length === 1 ? 'baby' : 'babies'}`} />
                  <Card>{list.map((s, i) => <ScreeningRow key={s.id} s={s} last={i === list.length - 1} />)}</Card>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {Platform.OS === 'android' && screenings.length > 0 ? (
        <Pressable
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel="New screening"
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={{ position: 'absolute', right: 16, bottom: 16, height: 56, paddingHorizontal: 20, borderRadius: 16, backgroundColor: t.brand, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 4, overflow: 'hidden' }}
        >
          <Icon name="camera" size={22} color={t.onBrand} />
          <Text style={[type.headline, { color: t.onBrand }]}>New screening</Text>
        </Pressable>
      ) : null}
    </>
  );
}
