import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LikelihoodBar } from '../../../components/result';
import { Card, Icon, IconName, SectionHeader } from '../../../components/ui';
import { MODEL, pct } from '../../../lib/clinical';
import { useModel } from '../../../lib/model';
import { type, useTheme } from '../../../lib/theme';

const TIPS: [IconName, string, string][] = [
  ['camera', 'Undress to the nappy', 'Chest, tummy and face uncovered on a plain white sheet.'],
  ['sun', 'Use neutral light', 'Daylight or white examination light. Turn off yellow lamps and phototherapy lights.'],
  ['frame', 'Fill the frame', 'Hold the phone steady, about an arm’s length away.'],
  ['redo', 'Retake if unsure', 'Dark, blurred or colour-tinted photos give unreliable results.'],
];

const LIMITS = [
  'Trained on photos from a single source.',
  'Not yet tested across skin tones, cameras or lighting.',
  'Not clinically validated or approved as a medical device.',
  'Reads the whole photo; it does not measure bilirubin.',
];

export default function ModelScreen() {
  const t = useTheme();
  const model = useModel();
  const m = MODEL.test;
  const c = m.confusion;
  const stats: [string, string, string][] = [
    ['Sensitivity', pct(m.sensitivity, 1), `Caught ${c.tp} of ${c.tp + c.fn} jaundice cases`],
    ['Specificity', pct(m.specificity, 1), `Cleared ${c.tn} of ${c.tn + c.fp} normal babies`],
    ['Accuracy', pct(m.accuracy, 1), `Across ${m.n} test photos`],
    ['AUC', m.auc.toFixed(2), 'Ranking quality, 0.5 to 1'],
  ];
  const status = model.state === 'loaded' ? 'Ready' : model.state === 'error' ? 'Failed to load' : 'Loading';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, width: '100%', maxWidth: 720, alignSelf: 'center' }}
    >
      <Card style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={18} color={t.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: t.text }]}>{MODEL.model}</Text>
          <Text style={[type.footnote, { color: t.text2 }]}>{status} · runs offline on this phone. Photos are never uploaded.</Text>
        </View>
      </Card>

      <SectionHeader title="Test results" aside={`${m.n} unseen photos`} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stats.map(([label, value, hint]) => (
          <Card key={label} style={{ padding: 14, flexGrow: 1, flexBasis: '45%' }}>
            <Text style={[type.footnote, { color: t.text2, fontWeight: '500' }]}>{label}</Text>
            <Text style={[type.stat, { color: t.text, marginTop: 4 }]}>{value}</Text>
            <Text style={[type.caption, { color: t.text3, marginTop: 2 }]}>{hint}</Text>
          </Card>
        ))}
      </View>
      <Text style={[type.footnote, { color: t.text2, marginTop: 10, marginHorizontal: 4 }]}>
        Of {c.tp + c.fn} test babies with jaundice it missed {c.fn}; of {c.tn + c.fp} without, it raised {c.fp} false alarms.
      </Text>

      <SectionHeader title="Decision cut-off" />
      <Card style={{ padding: 16, gap: 14 }}>
        <LikelihoodBar probability={null} threshold={MODEL.threshold} />
        {([
          ['Normal', `below ${pct(MODEL.threshold / 2, 1)}`],
          ['Moderate', `${pct(MODEL.threshold / 2, 1)} to ${pct(MODEL.threshold)}`],
          ['High', `${pct(MODEL.threshold)} and above`],
        ] as const).map(([k, range]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.risk[k].solid }} />
            <Text style={[type.callout, { color: t.text, flex: 1 }]}>{k === 'Moderate' ? 'Borderline' : k === 'High' ? 'High risk' : 'Normal'}</Text>
            <Text style={[type.callout, { color: t.text2, fontVariant: ['tabular-nums'] }]}>{range}</Text>
          </View>
        ))}
        <Text style={[type.footnote, { color: t.text2 }]}>
          Chosen on separate validation photos to catch at least 90% of jaundice. It is fixed by training, so every baby is judged the same way.
        </Text>
      </Card>

      <SectionHeader title="Taking the photo" />
      <Card>
        {TIPS.map(([icon, title, body], i) => (
          <View key={title} style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: i < TIPS.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: t.separator }}>
            <Icon name={icon} size={20} color={t.brand} />
            <View style={{ flex: 1 }}>
              <Text style={[type.headline, { color: t.text }]}>{title}</Text>
              <Text style={[type.footnote, { color: t.text2, marginTop: 2 }]}>{body}</Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title="Known limitations" />
      <Card style={{ padding: 16, gap: 10 }}>
        {LIMITS.map((l) => (
          <View key={l} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="high" size={16} color={t.risk.Moderate.solid} />
            <Text style={[type.callout, { color: t.text, flex: 1 }]}>{l}</Text>
          </View>
        ))}
      </Card>

      <Text style={[type.caption, { color: t.text3, marginTop: 16, marginHorizontal: 4 }]}>
        Training split: {MODEL.split_sizes.train} training, {MODEL.split_sizes.val} validation and {MODEL.split_sizes.test} test photos.
      </Text>
    </ScrollView>
  );
}
