import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';

type Tone = 'text' | 'secondary' | 'muted' | 'faint' | 'primary' | 'onPrimary' | 'success' | 'error';

interface TextProps {
  children: ReactNode;
  tone?: Tone;
  lines?: number;
}

const SIZES: Record<'title' | 'section' | 'body' | 'value' | 'meta', number> = {
  title: 24,
  section: 16,
  body: 15,
  value: 16,
  meta: 12,
};

function toneColor(colors: ReturnType<typeof useTheme>['colors'], tone: Tone): string {
  switch (tone) {
    case 'secondary':
      return colors.textSecondary;
    case 'muted':
      return colors.textMuted;
    case 'faint':
      return colors.textFaint;
    case 'primary':
      return colors.primary;
    case 'onPrimary':
      return colors.onPrimary;
    case 'success':
      return colors.success;
    case 'error':
      return colors.errorText;
    default:
      return colors.text;
  }
}

type Kind = keyof typeof SIZES;

function Typed({ children, tone = 'text', lines, kind }: TextProps & { kind: Kind }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <Text
      numberOfLines={lines}
      style={[
        styles[kind],
        { color: toneColor(colors, tone), fontSize: scale(SIZES[kind], layout.typeScale) },
      ]}
    >
      {children}
    </Text>
  );
}

export const Title = ({ children, tone, lines }: TextProps) => <Typed kind="title" tone={tone} lines={lines}>{children}</Typed>;
export const SectionTitle = ({ children, tone, lines }: TextProps) => <Typed kind="section" tone={tone ?? 'secondary'} lines={lines}>{children}</Typed>;
export const Body = ({ children, tone, lines }: TextProps) => <Typed kind="body" tone={tone} lines={lines}>{children}</Typed>;
export const Value = ({ children, tone, lines }: TextProps) => <Typed kind="value" tone={tone} lines={lines}>{children}</Typed>;
export const Meta = ({ children, tone, lines }: TextProps) => <Typed kind="meta" tone={tone ?? 'muted'} lines={lines}>{children}</Typed>;

const styles = StyleSheet.create({
  title: { fontWeight: '700' },
  section: { fontWeight: '600' },
  body: {},
  value: {},
  meta: { fontWeight: '700', letterSpacing: 0.4 },
});
