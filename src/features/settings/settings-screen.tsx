import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Switch, View } from 'react-native';

import { deleteCurrentUser, updateCurrentUser } from '@/features/auth/api';
import { SIGN_IN_HREF, useAuth } from '@/features/auth';
import { getPushPreference, setPushEnabled } from '@/features/notifications/push-notifications';
import { AppHeader } from '@/features/shell/components/app-header';
import { useSubmit } from '@/shared/api/use-resource';
import { useTheme, type ThemePreference } from '@/shared/theme';
import { Body, Button, Card, ErrorBanner, Field, OptionChips, Screen, Sheet } from '@/shared/ui';

export function SettingsScreen() {
  const { user, refreshUser, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [pushEnabled, setPushEnabledState] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const profileSubmit = useSubmit();
  const pushSubmit = useSubmit();
  const deleteSubmit = useSubmit();

  useEffect(() => {
    getPushPreference().then(setPushEnabledState).catch(() => setPushEnabledState(false));
  }, []);

  const saveProfile = async () => {
    const ok = await profileSubmit.run(() => updateCurrentUser({ full_name: fullName.trim() }), 'Profile updated.');
    if (ok) await refreshUser();
  };

  const changePush = async (enabled: boolean) => {
    const ok = await pushSubmit.run(async () => {
      const active = await setPushEnabled(enabled);
      setPushEnabledState(active);
      if (enabled && !active) {
        throw new Error('Push notification permission was not granted on this device.');
      }
      await refreshUser();
    }, enabled ? 'Push notifications enabled.' : 'Push notifications disabled.');
    if (!ok) setPushEnabledState(await getPushPreference().catch(() => false));
  };

  const deleteAccount = async () => {
    const ok = await deleteSubmit.run(() => deleteCurrentUser(), 'Account deleted.');
    if (!ok) return;
    await signOut();
    router.replace(SIGN_IN_HREF);
  };

  return (
    <Screen scroll width="content">
      <AppHeader title="Settings" subtitle="Manage your profile, appearance, device notifications, and account." />

      <Card title="Profile">
        {profileSubmit.error ? <ErrorBanner title="Could not update profile" messages={profileSubmit.error} /> : null}
        {profileSubmit.notice ? <Body tone="success">{profileSubmit.notice}</Body> : null}
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Body tone="secondary">{user?.email ?? '—'}</Body>
        <Body tone="muted">{user?.role ?? '—'} account · username {user?.username ?? '—'}</Body>
        <Button label="Save profile" loading={profileSubmit.pending} disabled={!fullName.trim() || fullName.trim() === user?.full_name} onPress={saveProfile} />
      </Card>

      <Card title="Appearance">
        <OptionChips<ThemePreference>
          label="Theme preference"
          value={preference}
          onChange={setPreference}
          options={[
            { value: 'system', label: 'Use device setting' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <Card title="Push notifications">
        {pushSubmit.error ? <ErrorBanner title="Could not change push preference" messages={pushSubmit.error} /> : null}
        {pushSubmit.notice ? <Body tone="success">{pushSubmit.notice}</Body> : null}
        {Platform.OS === 'web' ? (
          <Body tone="muted">Push registration is available in the installed Android or iOS app. Your persistent notification inbox still works on web.</Body>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Body>This device</Body>
              <Body tone="muted">{pushEnabled ? 'Push alerts are enabled' : 'Push alerts are disabled'}</Body>
            </View>
            <Switch
              accessibilityLabel="Push notifications on this device"
              value={pushEnabled}
              disabled={pushSubmit.pending}
              onValueChange={changePush}
              trackColor={{ false: colors.border, true: colors.tones.primary.background }}
              thumbColor={pushEnabled ? colors.primary : colors.surface}
            />
          </View>
        )}
        <Body tone="muted">Turning this off removes this device token. Announcements remain available in the app inbox.</Body>
      </Card>

      <Card title="Delete account">
        <Body tone="muted">This permanently disables sign-in and anonymizes your identity. Assessment and audit records remain intact.</Body>
        <Button label="Delete my account" variant="secondary" onPress={() => { setConfirmation(''); deleteSubmit.reset(); setConfirmingDelete(true); }} />
      </Card>

      <Sheet title="Confirm account deletion" visible={confirmingDelete} onDismiss={() => setConfirmingDelete(false)}>
        {deleteSubmit.error ? <ErrorBanner title="Could not delete account" messages={deleteSubmit.error} /> : null}
        <Body>This cannot be undone. Type DELETE to confirm.</Body>
        <Field label="Confirmation" value={confirmation} autoCapitalize="characters" onChangeText={setConfirmation} />
        <Button label="Permanently delete account" loading={deleteSubmit.pending} disabled={confirmation !== 'DELETE'} onPress={deleteAccount} />
      </Sheet>
    </Screen>
  );
}
