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
import { useI18n, type LanguagePreference } from '@/shared/i18n';

export function SettingsScreen() {
  const { user, refreshUser, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { t, preference: languagePreference, setPreference: setLanguagePreference } = useI18n();
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
      <AppHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Card title={t('settings.profile')}>
        {profileSubmit.error ? <ErrorBanner title="Could not update profile" messages={profileSubmit.error} /> : null}
        {profileSubmit.notice ? <Body tone="success">{profileSubmit.notice}</Body> : null}
        <Field label={t('settings.fullName')} value={fullName} onChangeText={setFullName} />
        <Body tone="secondary">{user?.email ?? '—'}</Body>
        <Body tone="muted">{user?.role ?? '—'} account · username {user?.username ?? '—'}</Body>
        <Button label={t('settings.saveProfile')} loading={profileSubmit.pending} disabled={!fullName.trim() || fullName.trim() === user?.full_name} onPress={saveProfile} />
      </Card>

      <Card title={t('settings.language')}>
        <OptionChips<LanguagePreference>
          label={t('settings.languagePreference')}
          value={languagePreference}
          onChange={setLanguagePreference}
          options={[
            { value: 'system', label: t('common.system') },
            { value: 'en', label: t('common.english') },
            { value: 'my', label: t('common.myanmar') },
          ]}
        />
      </Card>

      <Card title={t('settings.appearance')}>
        <OptionChips<ThemePreference>
          label={t('settings.theme')}
          value={preference}
          onChange={setPreference}
          options={[
            { value: 'system', label: t('common.system') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
      </Card>

      <Card title={t('settings.push')}>
        {pushSubmit.error ? <ErrorBanner title="Could not change push preference" messages={pushSubmit.error} /> : null}
        {pushSubmit.notice ? <Body tone="success">{pushSubmit.notice}</Body> : null}
        {Platform.OS === 'web' ? (
          <Body tone="muted">Push registration is available in the installed Android or iOS app. Your persistent notification inbox still works on web.</Body>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Body>{t('settings.device')}</Body>
              <Body tone="muted">{pushEnabled ? t('settings.pushOn') : t('settings.pushOff')}</Body>
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

      <Card title={t('settings.delete')}>
        <Body tone="muted">This permanently disables sign-in and anonymizes your identity. Assessment and audit records remain intact.</Body>
        <Button label={t('settings.deleteMine')} variant="secondary" onPress={() => { setConfirmation(''); deleteSubmit.reset(); setConfirmingDelete(true); }} />
      </Card>

      <Sheet title={t('settings.confirmDelete')} visible={confirmingDelete} onDismiss={() => setConfirmingDelete(false)}>
        {deleteSubmit.error ? <ErrorBanner title="Could not delete account" messages={deleteSubmit.error} /> : null}
        <Body>{t('settings.typeDelete')}</Body>
        <Field label={t('settings.confirmation')} value={confirmation} autoCapitalize="characters" onChangeText={setConfirmation} />
        <Button label={t('settings.deletePermanent')} loading={deleteSubmit.pending} disabled={confirmation !== 'DELETE'} onPress={deleteAccount} />
      </Sheet>
    </Screen>
  );
}
