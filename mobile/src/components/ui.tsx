import { SymbolView } from 'expo-symbols';
import { ReactNode } from 'react';
import { ActivityIndicator, ColorValue, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { radius, Theme, TOUCH, type, useTheme } from '../lib/theme';

const ICONS = {
  plus: { ios: 'plus', android: 'add' },
  home: { ios: 'house', android: 'home' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  camera: { ios: 'camera.fill', android: 'photo_camera' },
  photo: { ios: 'photo.on.rectangle', android: 'image' },
  high: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  moderate: { ios: 'questionmark.circle.fill', android: 'help' },
  normal: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  check: { ios: 'checkmark.circle', android: 'check_circle' },
  close: { ios: 'xmark', android: 'close' },
  trash: { ios: 'trash', android: 'delete' },
  list: { ios: 'list.bullet.rectangle.portrait', android: 'list_alt' },
  gauge: { ios: 'gauge.with.dots.needle.67percent', android: 'speed' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  info: { ios: 'info.circle', android: 'info' },
  sun: { ios: 'sun.max', android: 'light_mode' },
  frame: { ios: 'viewfinder', android: 'center_focus_strong' },
  redo: { ios: 'arrow.clockwise', android: 'refresh' },
  lock: { ios: 'lock.fill', android: 'lock' },
  stethoscope: { ios: 'stethoscope', android: 'stethoscope' },
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: ColorValue }) {
  return <SymbolView name={ICONS[name] as never} size={size} tintColor={color} resizeMode="scaleAspectFit" style={{ width: size, height: size }} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[cardStyle(t), style]}>{children}</View>;
}

export const cardStyle = (t: Theme): ViewStyle => ({
  backgroundColor: t.card,
  borderRadius: radius.card,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: t.border,
  overflow: 'hidden',
});

export function SectionHeader({ title, aside, action }: { title: string; aside?: string; action?: { label: string; onPress: () => void } }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: action ? 0 : 8, marginTop: action ? 12 : 24 }}>
      <Text style={[type.footnote, { color: t.text2, fontWeight: '600', textTransform: Platform.OS === 'ios' ? 'uppercase' : 'none', letterSpacing: Platform.OS === 'ios' ? 0.4 : 0.1 }]} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} accessibilityRole="link" hitSlop={8} style={{ minHeight: TOUCH, justifyContent: 'center' }}>
          <Text style={[type.subhead, { color: t.brand, fontWeight: '600' }]}>{action.label}</Text>
        </Pressable>
      ) : aside ? (
        <Text style={[type.footnote, { color: t.text3 }]}>{aside}</Text>
      ) : null}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'filled' | 'tonal' | 'outlined' | 'plain';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, variant = 'filled', loading, disabled, style }: ButtonProps) {
  const t = useTheme();
  const bg = variant === 'filled' ? t.brand : variant === 'tonal' ? t.brandSoft : 'transparent';
  const fg = variant === 'filled' ? t.onBrand : t.brand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: variant === 'filled' ? 'rgba(255,255,255,0.18)' : 'rgba(15,118,110,0.12)' }}
      style={({ pressed }) => [
        {
          minHeight: Math.max(TOUCH, 50),
          borderRadius: Platform.OS === 'android' ? 999 : radius.control,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: bg,
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: t.border,
          opacity: disabled ? 0.45 : Platform.OS === 'ios' && pressed ? 0.75 : 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[type.headline, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({
  children,
  onPress,
  last,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  last?: boolean;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const inner = (pressed: boolean) => (
    <View
      style={{
        minHeight: TOUCH + 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: pressed && Platform.OS === 'ios' ? t.cardPressed : 'transparent',
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.separator,
      }}
    >
      {children}
    </View>
  );
  if (!onPress) return inner(false);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} android_ripple={{ color: t.cardPressed }}>
      {({ pressed }) => inner(pressed)}
    </Pressable>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} color={t.brand} />
      </View>
      <Text style={[type.title, { color: t.text, marginTop: 16, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.callout, { color: t.text2, marginTop: 6, textAlign: 'center', maxWidth: 320 }]}>{body}</Text>
      {action ? <View style={{ marginTop: 20, alignSelf: 'stretch', maxWidth: 360, width: '100%' }}>{action}</View> : null}
    </View>
  );
}

export function Avatar({ name }: { name: string }) {
  const t = useTheme();
  const core = name.replace(/^baby\s+(of\s+)?/i, '').replace(/[^\p{L}\s]/gu, ' ');
  const initials = core.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }}>
      <Text style={[type.footnote, { color: t.text2, fontWeight: '600' }]}>{initials}</Text>
    </View>
  );
}
