import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { HOME_BY_ROLE } from '@/features/auth/routes';
import { API_URL } from '@/shared/config/env';
import { ApiError } from '@/shared/api/types';
import { scale, useResponsive, useTheme } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { Field } from '@/shared/ui/field';
import { Screen } from '@/shared/ui/screen';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

interface FormError {
  title: string;
  messages: string[];
}

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

  // Phones fill the screen; tablets and desktop windows get a card with its own surface.
  const cardStyle = {
    gap: layout.gap - 4,
    ...(layout.breakpoint === 'compact'
      ? undefined
      : {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: layout.gap,
        }),
  };

  return (
    <Screen scroll width="form">
      <ThemeToggle />

      <Text style={[styles.title, { color: colors.text, fontSize: scale(28, layout.typeScale) }]}>AssessMatrix</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: scale(15, layout.typeScale) }]}>
        Sign in with your university email.
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={cardStyle}>
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

      <Text style={{ color: colors.textFaint, fontSize: scale(13, layout.typeScale), lineHeight: scale(19, layout.typeScale) }}>
        The API assigns your role — ADMIN, TEACHER or STUDENT — from the account, so this form does not ask for it.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700' },
  subtitle: { marginBottom: 2 },
});
