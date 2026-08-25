import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { resetPassword } from '@/services/auth.service';
import { theme } from '@/theme';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/types/auth';

// Map technical Supabase errors to friendly, user-facing messages so raw
// backend details are not exposed. Falls back to a generic message.
function getFriendlyError(error: { message?: string } | null): string {
  const message = error?.message?.toLowerCase() ?? '';

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (message.includes('not found') || message.includes('invalid')) {
    return 'No account found with that email address.';
  }

  return 'Something went wrong sending the reset link. Please try again.';
}

export default function ForgotPasswordScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setSubmitError(null);

    const { error } = await resetPassword(data.email);

    if (error) {
      setSubmitError(getFriendlyError(error));
      return;
    }

    // Success: keep the user on this screen and show a confirmation state.
    setEmailSent(true);
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {emailSent ? (
          <View style={styles.successContainer}>
            <Text variant="title">Check your email</Text>
            <Text variant="body" style={styles.subtitle}>
              We&apos;ve sent a password reset link to your email. Open the
              link to reset your password.
            </Text>

            <Button title="Back to Login" fullWidth onPress={handleBackToLogin} />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="title">Forgot Password?</Text>
              <Text variant="body" style={styles.subtitle}>
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    error={errors.email?.message}
                  />
                )}
              />

              {submitError && (
                <Text variant="caption" style={styles.submitError}>
                  {submitError}
                </Text>
              )}

              <Button
                title="Send Reset Link"
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>

            <Pressable onPress={handleBackToLogin} hitSlop={8} style={styles.backLink}>
              <Text variant="label" style={styles.backLinkText}>
                Back to Login
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },

  header: {
    gap: theme.spacing.xs,
  },

  subtitle: {
    color: theme.colors.text.secondary,
  },

  form: {
    gap: theme.spacing.md,
  },

  submitError: {
    color: theme.colors.semantic.danger.main,
    textAlign: 'center',
  },

  backLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },

  backLinkText: {
    color: theme.colors.primary.main,
  },

  successContainer: {
    gap: theme.spacing.md,
  },
});