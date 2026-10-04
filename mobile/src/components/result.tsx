import { Text, View } from 'react-native';

import { pct, RiskKey, RISKS } from '../lib/clinical';
import { radius, type, useTheme } from '../lib/theme';
import { Icon, IconName } from './ui';

const RISK_ICON: Record<RiskKey, IconName> = { High: 'high', Moderate: 'moderate', Normal: 'normal' };

/** Status chip: icon plus word, never colour alone. */
export function RiskBadge({ risk, size = 'md' }: { risk: RiskKey; size?: 'md' | 'lg' }) {
  const t = useTheme();
  const c = t.risk[risk];
  const lg = size === 'lg';
  return (
    <View
      accessible
      accessibilityLabel={RISKS[risk].word}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: c.bg, borderColor: c.border, borderWidth: 1, borderRadius: radius.chip, paddingHorizontal: lg ? 10 : 8, paddingVertical: lg ? 5 : 3 }}
    >
      <Icon name={RISK_ICON[risk]} size={lg ? 15 : 13} color={c.fg} />
      <Text style={[lg ? type.subhead : type.caption, { color: c.fg, fontWeight: '600' }]}>{RISKS[risk].word}</Text>
    </View>
  );
}

/** Likelihood bar with the normal / borderline / high zones and the cut-off marked. */
export function LikelihoodBar({ probability, threshold, showScale = true }: { probability: number | null; threshold: number; showScale?: boolean }) {
  const t = useTheme();
  const mid = threshold / 2;
  const fill = probability == null ? null : probability >= threshold ? t.risk.High.solid : probability >= mid ? t.risk.Moderate.solid : t.risk.Normal.solid;
  return (
    <View>
      <View style={{ height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row', backgroundColor: t.border }}>
        <View style={{ width: `${mid * 100}%`, backgroundColor: t.zone.Normal, opacity: 0.55 }} />
        <View style={{ width: `${(threshold - mid) * 100}%`, backgroundColor: t.zone.Moderate, opacity: 0.55 }} />
        <View style={{ flex: 1, backgroundColor: t.zone.High, opacity: 0.55 }} />
        {fill ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(probability!, 0.015) * 100}%`, backgroundColor: fill, borderRadius: 5 }} /> : null}
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${threshold * 100}%`, width: 2, marginLeft: -1, backgroundColor: t.text }} />
      </View>
      {showScale ? (
        <View style={{ height: 18, marginTop: 6 }}>
          <Text style={[type.caption, { color: t.text3, position: 'absolute', left: 0 }]}>0%</Text>
          <Text style={[type.caption, { color: t.text2, fontWeight: '600', position: 'absolute', left: `${threshold * 100}%`, transform: [{ translateX: -50 }], width: 100, textAlign: 'center' }]} numberOfLines={1}>
            Cut-off {pct(threshold)}
          </Text>
          <Text style={[type.caption, { color: t.text3, position: 'absolute', right: 0 }]}>100%</Text>
        </View>
      ) : null}
    </View>
  );
}

/** The result block: status, headline, and the likelihood against the cut-off. */
export function ResultPanel({ risk, probability, threshold }: { risk: RiskKey; probability: number | null; threshold: number }) {
  const t = useTheme();
  const c = t.risk[risk];
  return (
    <View>
      <View
        accessible
        accessibilityLabel={`${RISKS[risk].word}. ${RISKS[risk].headline}.`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bg, borderColor: c.border, borderWidth: 1, borderRadius: radius.control, padding: 14 }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.solid, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={RISK_ICON[risk]} size={22} color={c.onSolid} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: c.fg }]}>{RISKS[risk].word}</Text>
          <Text style={[type.callout, { color: t.text }]}>{RISKS[risk].headline}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, marginBottom: 10 }}>
        <Text style={[type.subhead, { color: t.text2, fontWeight: '500' }]}>Jaundice likelihood</Text>
        <Text style={[type.stat, { color: t.text }]} accessibilityLabel={`Jaundice likelihood ${pct(probability, 1)}`}>
          {pct(probability, 1)}
        </Text>
      </View>
      <LikelihoodBar probability={probability} threshold={threshold} />
    </View>
  );
}
