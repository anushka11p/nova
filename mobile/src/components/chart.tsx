import { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { RiskKey } from '../lib/clinical';
import { localDayKey, Screening } from '../lib/store';
import { type, useTheme } from '../lib/theme';

const ORDER: RiskKey[] = ['Normal', 'Moderate', 'High'];
const LABEL: Record<RiskKey, string> = { High: 'High risk', Moderate: 'Borderline', Normal: 'Normal' };

/** Screenings per day for the last `days` days, stacked by result. */
export function DailyChart({ screenings, now, days = 14, height = 132 }: { screenings: Screening[]; now: number; days?: number; height?: number }) {
  const t = useTheme();
  const data = useMemo(() => {
    const out: { key: string; day: Date; counts: Record<RiskKey, number>; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push({ key: localDayKey(d), day: d, counts: { High: 0, Moderate: 0, Normal: 0 }, total: 0 });
    }
    const byKey = new Map(out.map((d) => [d.key, d]));
    for (const s of screenings) {
      const d = byKey.get(localDayKey(new Date(s.createdAt)));
      if (d) {
        d.counts[s.risk] += 1;
        d.total += 1;
      }
    }
    return out;
  }, [screenings, now, days]);

  const top = Math.max(4, ...data.map((d) => d.total));
  const total = data.reduce((n, d) => n + d.total, 0);

  return (
    <View accessible accessibilityLabel={`${total} screenings in the last ${days} days`}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 4, borderBottomWidth: 1, borderBottomColor: t.border }}>
        {data.map((d) => (
          <View key={d.key} style={{ flex: 1, height: `${(d.total / top) * 100}%`, borderTopLeftRadius: 3, borderTopRightRadius: 3, overflow: 'hidden', flexDirection: 'column-reverse' }}>
            {ORDER.map((k) => (d.counts[k] ? <View key={k} style={{ flex: d.counts[k], backgroundColor: t.risk[k].solid }} /> : null))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={[type.caption, { color: t.text3 }]}>{data[0].day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
        <Text style={[type.caption, { color: t.text3 }]}>Today</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
        {[...ORDER].reverse().map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: t.risk[k].solid }} />
            <Text style={[type.caption, { color: t.text2 }]}>{LABEL[k]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
