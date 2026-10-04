import { Platform, useColorScheme } from 'react-native';

/** Nova's palette: the web portal's teal and slate, with a first-class dark scheme. */
const light = {
  bg: '#F3F5F8',
  card: '#FFFFFF',
  cardPressed: '#F1F5F9',
  text: '#0F172A',
  text2: '#475569',
  text3: '#64748B',
  border: '#E2E8F0',
  separator: '#E5E9F0',
  brand: '#0F766E',
  brandSoft: '#E6F6F4',
  onBrand: '#FFFFFF',
  input: '#FFFFFF',
  photoBg: '#0F172A',
  risk: {
    High: { fg: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', solid: '#DC2626', onSolid: '#FFFFFF' },
    Moderate: { fg: '#92400E', bg: '#FFFBEB', border: '#FDE68A', solid: '#D97706', onSolid: '#FFFFFF' },
    Normal: { fg: '#047857', bg: '#ECFDF5', border: '#A7F3D0', solid: '#059669', onSolid: '#FFFFFF' },
  },
  zone: { Normal: '#BBF7D0', Moderate: '#FDE68A', High: '#FECACA' },
};

export type Theme = typeof light;

const dark: Theme = {
  bg: '#0A0F1A',
  card: '#131B2B',
  cardPressed: '#1B2638',
  text: '#F1F5F9',
  text2: '#CBD5E1',
  text3: '#94A3B8',
  border: '#243045',
  separator: '#1F2A3D',
  brand: '#2DD4BF',
  brandSoft: '#0E2F2C',
  onBrand: '#042F2E',
  input: '#0F1626',
  photoBg: '#000000',
  risk: {
    High: { fg: '#FCA5A5', bg: '#3A1518', border: '#7F1D1D', solid: '#EF4444', onSolid: '#FFFFFF' },
    Moderate: { fg: '#FCD34D', bg: '#35270A', border: '#78350F', solid: '#F59E0B', onSolid: '#1C1303' },
    Normal: { fg: '#6EE7B7', bg: '#0D2C22', border: '#065F46', solid: '#10B981', onSolid: '#04120C' },
  },
  zone: { Normal: '#14532D', Moderate: '#78350F', High: '#7F1D1D' },
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

/** One type scale, following the system font on each platform. */
export const type = {
  largeTitle: { fontSize: 30, fontWeight: '700' as const, letterSpacing: Platform.OS === 'ios' ? 0.3 : 0 },
  title: { fontSize: 20, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22 },
  callout: { fontSize: 15, lineHeight: 20 },
  subhead: { fontSize: 14, lineHeight: 19 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  stat: { fontSize: 28, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] },
};

export const radius = { card: 14, control: 12, chip: 8 };
/** Minimum touch target: 44 pt on iOS, 48 dp on Android. */
export const TOUCH = Platform.OS === 'ios' ? 44 : 48;
