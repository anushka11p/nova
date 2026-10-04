import { router } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { formatAge, pct } from '../lib/clinical';
import { localDayKey, Screening } from '../lib/store';
import { type, useTheme } from '../lib/theme';
import { RiskBadge } from './result';
import { Avatar, Icon, Row } from './ui';

export function time(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function dayLabel(key: string) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (key === localDayKey(today)) return 'Today';
  if (key === localDayKey(yesterday)) return 'Yesterday';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** One baby in a list. `withDay` adds Today / Yesterday / date before the time. */
export function ScreeningRow({ s, last, withDay }: { s: Screening; last?: boolean; withDay?: boolean }) {
  const t = useTheme();
  const when = withDay ? `${dayLabel(localDayKey(new Date(s.createdAt)))}, ${time(s.createdAt)}` : time(s.createdAt);
  return (
    <Row onPress={() => router.push(`/screening/${s.id}`)} last={last} accessibilityLabel={`${s.name}, ${formatAge(s.ageDays)}, screened ${when}`}>
      <Avatar name={s.name} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.headline, { color: t.text }]} numberOfLines={1}>{s.name}</Text>
        <Text style={[type.footnote, { color: t.text2 }]} numberOfLines={1}>
          {formatAge(s.ageDays)} · {when}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <RiskBadge risk={s.risk} />
        <Text style={[type.footnote, { color: t.text2, fontVariant: ['tabular-nums'] }]}>{pct(s.probability, 1)}</Text>
      </View>
      {Platform.OS === 'ios' ? <Icon name="chevron" size={13} color={t.text3} /> : null}
    </Row>
  );
}
