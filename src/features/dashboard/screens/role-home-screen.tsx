import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SIGN_IN_HREF, useAuth } from '@/features/auth';
import { ROLE_LABELS, type Role } from '@/features/auth/types';
import { ROLE_COPY } from '@/features/dashboard/copy';
import { ApiError } from '@/shared/api/types';
import { scale, useResponsive, useTheme } from '@/shared/theme';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { Screen } from '@/shared/ui/screen';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

export function RoleHomeScreen({ role }: { role: Role }) {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const { colors } = useTheme();
  const layout = useResponsive();
  const [checking, setChecking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string[] | null>(null);

  const copy = ROLE_COPY[role];
  const twoUp = layout.detailColumns === 2;

  const checkSession = async () => {
    setChecking(true);
    setError(null);
    setNotice(null);
    try {
      const profile = await refreshUser();
      setNotice(`Session valid — GET /api/me/ returned ${profile.email}.`);
    } catch (caught) {
      setError([caught instanceof ApiError ? caught.message : String(caught)]);
    } finally {
      setChecking(false);
    }
  };

  const leave = async () => {
    setLeaving(true);
    try {
      await signOut();
      router.replace(SIGN_IN_HREF);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <Screen scroll>
      <ThemeToggle />

      <Badge label={ROLE_LABELS[role]} />
      <Text style={[styles.title, { color: colors.text, fontSize: scale(24, layout.typeScale) }]}>{copy.title}</Text>
      <Text style={{ color: colors.textMuted, fontSize: scale(15, layout.typeScale) }}>{copy.summary}</Text>

      {error ? <ErrorBanner title="Request failed" messages={error} /> : null}
      {notice ? (
        <Text style={{ color: colors.success, fontSize: scale(14, layout.typeScale) }}>{notice}</Text>
      ) : null}

      <View
        style={[
          styles.card,
          twoUp ? styles.gridWide : styles.gridNarrow,
          { backgroundColor: colors.surface, borderColor: colors.border, padding: layout.gap },
        ]}
      >
        <Detail label="Name" value={user?.full_name ?? '—'} twoUp={twoUp} />
        <Detail label="Email" value={user?.email ?? '—'} twoUp={twoUp} />
        <Detail label="Username" value={user?.username ?? '—'} twoUp={twoUp} />
        <Detail label="User id" value={user?.id ?? '—'} twoUp={twoUp} />
        <Detail label="Signed in" value={user?.last_login ?? '—'} twoUp={twoUp} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scale(15, layout.typeScale) }]}>
        Available next
      </Text>
      {copy.next.map((route) => (
        <Text key={route} style={{ color: colors.textFaint, fontSize: scale(14, layout.typeScale) }}>
          {route}
        </Text>
      ))}

      <View style={twoUp ? styles.actionsRow : undefined}>
        <Button label="Check session" variant="secondary" loading={checking} onPress={checkSession} />
        <Button label="Sign out" loading={leaving} onPress={leave} />
      </View>
    </Screen>
  );
}

function Detail({ label, value, twoUp }: { label: string; value: string; twoUp: boolean }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={[styles.detail, twoUp && { width: '47%' }]}>
      <Text style={{ color: colors.textMuted, fontSize: scale(12, layout.typeScale) }} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: colors.text, fontSize: scale(16, layout.typeScale) }} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1 },
  gridNarrow: { flexDirection: 'column', gap: 12 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detail: { gap: 2 },
  sectionTitle: { fontWeight: '600', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12 },
});
