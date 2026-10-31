import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { HOME_BY_ROLE } from '@/features/auth/routes';
import { API_URL } from '@/shared/config/env';
import { ApiError } from '@/shared/api/types';
import { elevation, radius, scale, useResponsive, useTheme } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { Field } from '@/shared/ui/field';
import { Screen } from '@/shared/ui/screen';

interface FormError {
  title: string;
  messages: string[];
}

const CREST = require('@/assets/brand/crest-mark.png');

function describeError(error: unknown): FormError {
  if (error instanceof ApiError) {
    // 401 comes from SimpleJWT as { detail }; the rest of the API uses { code, detail, fields }.
    const messages = error.fieldErrors();
    return {
      title: error.status === 401 ? 'Email or password is incorrect.' : error.message,
      messages: error.status === 401 ? messages : messages.length > 0 ? messages : [error.message],
    };
  }

  return {
    title: 'The API is unreachable.',
    messages: [`${API_URL} — is the Django server running?`, String(error)],
  };
}

export function SignInScreen() {
  const { status, user, signIn } = useAuth();
  const { colors } = useTheme();
  const layout = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  if (status === 'signed-in' && user !== null) {
    return <Redirect href={HOME_BY_ROLE[user.role]} />;
  }

  const submit = async () => {
    const trimmed = email.trim();
    if (trimmed === '' || password === '') {
      setError({ title: 'Enter both email and password.', messages: [] });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn(trimmed, password);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  // Keep one recognisable institutional sign-in surface on every platform. The compact version
  // loses only the shadow so it still feels native inside a narrow Android viewport.
  const cardStyle = {
    gap: layout.gap - 2,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: layout.breakpoint === 'compact' ? 20 : 28,
    ...(layout.breakpoint === 'compact' ? undefined : elevation(colors, true)),
  };

  return (
    <Screen scroll width="form">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cardStyle}>
        <View style={[styles.brand, { borderBottomColor: colors.border }]}>
          <Image source={CREST} style={styles.crest} contentFit="contain" />
          <View style={styles.brandCopy}>
            <Text style={[styles.product, { color: colors.text, fontSize: scale(19, layout.typeScale) }]}>AssessMatrix</Text>
            <Text style={{ color: colors.textMuted, fontSize: scale(12, layout.typeScale) }}>ACADEMIC OPERATIONS</Text>
          </View>
        </View>

        <View style={styles.heading}>
          <Text style={[styles.title, { color: colors.text, fontSize: scale(27, layout.typeScale) }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: scale(15, layout.typeScale) }]}>
            Sign in with your university email to continue.
          </Text>
        </View>

        {error ? <ErrorBanner title={error.title} messages={error.messages} /> : null}

        <Field
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="aye@university.edu"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Password"
          autoComplete="password"
          placeholder="••••••••"
          secureTextEntry
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />

        <Button label="Sign in" loading={submitting} onPress={submit} />
      </KeyboardAvoidingView>

      <Text style={[styles.help, { color: colors.textFaint, fontSize: scale(12, layout.typeScale), lineHeight: scale(18, layout.typeScale) }]}>
        Secure access for authorised administrators, lecturers, and students. Your workspace is selected automatically.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingBottom: 18 },
  brandCopy: { gap: 1 },
  crest: { height: 42, width: 42 },
  product: { fontWeight: '800', letterSpacing: -0.3 },
  heading: { gap: 5, paddingTop: 4 },
  title: { fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { marginBottom: 2 },
  help: { alignSelf: 'center', maxWidth: 480, textAlign: 'center' },
});
