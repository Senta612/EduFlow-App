import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
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
import { getFriendlyAuthMessage, updatePassword } from '@/services/auth.service';
import { theme } from '@/theme';
import { ResetPasswordFormData, resetPasswordSchema } from '@/types/auth';

export default function ResetPasswordScreen() {
  const [resetError, setResetError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setResetError(null);

    const { error, errorKind } = await updatePassword(data.password);

    if (error || errorKind) {
      setResetError(
        errorKind
          ? getFriendlyAuthMessage(errorKind)
          : 'Failed to update password. Your reset link may be invalid or expired.',
      );
      return;
    }

    setIsSuccess(true);
    Alert.alert(
      'Password Updated',
      'Your password has been successfully updated. Please sign in with your new password.',
      [{ text: 'Sign In', onPress: () => router.replace('/login') }],
    );
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
        <View style={styles.header}>
          <Text variant="title">Reset Password</Text>
          <Text variant="body" style={styles.subtitle}>
            Please enter and confirm your new password.
          </Text>
        </View>

        {isSuccess ? (
          <View style={styles.successContainer}>
            <Text variant="heading" style={styles.successTitle}>
              Password Changed!
            </Text>
            <Text variant="body" style={styles.subtitle}>
              You can now sign in with your new password.
            </Text>
            <Button
              title="Back to Login"
              fullWidth
              onPress={() => router.replace('/login')}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={errors.password?.message}
                  rightContent={
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={8}
                      style={styles.eyeButton}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </Pressable>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  error={errors.confirmPassword?.message}
                  rightContent={
                    <Pressable
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      hitSlop={8}
                      style={styles.eyeButton}
                    >
                      <Feather
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </Pressable>
                  }
                />
              )}
            />

            {resetError && (
              <Text variant="caption" style={styles.submitError}>
                {resetError}
              </Text>
            )}

            <Button
              title="Update Password"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
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

  eyeButton: {
    padding: theme.spacing.xs,
  },

  successContainer: {
    gap: theme.spacing.md,
  },

  successTitle: {
    color: theme.colors.semantic.success.main,
  },
});
