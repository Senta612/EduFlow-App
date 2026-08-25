import { Feather } from '@expo/vector-icons';
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
import { getFriendlyAuthMessage, signIn } from '@/services/auth.service';
import { theme } from '@/theme';
import { LoginFormData, loginSchema } from '@/types/auth';

export default function LoginScreen() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);

    const { error, errorKind } = await signIn(data.email, data.password);

    if (error || errorKind) {
      setLoginError(getFriendlyAuthMessage(errorKind ?? 'unknown'));
      return;
    }
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
          <Text variant="title">Welcome Back</Text>
          <Text variant="body" style={styles.subtitle}>
            Sign in to continue your learning journey
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
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

          <Pressable
            onPress={() => router.push('/forgot-password')}
            hitSlop={8}
            style={styles.forgotPassword}
          >
            <Text variant="label" style={styles.forgotPasswordLink}>
              Forgot password?
            </Text>
          </Pressable>

          {loginError && (
            <Text variant="caption" style={styles.submitError}>
              {loginError}
            </Text>
          )}

          <Button
            title="Login"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text variant="body" style={styles.switchText}>
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.replace('/signup')} hitSlop={8}>
            <Text variant="label" style={styles.switchLink}>
              Create one
            </Text>
          </Pressable>
        </View>
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

  forgotPassword: {
    alignSelf: 'flex-end',
    paddingTop: theme.spacing.xs,
  },

  forgotPasswordLink: {
    color: theme.colors.primary.main,
  },

  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },

  switchText: {
    color: theme.colors.text.secondary,
  },

  switchLink: {
    color: theme.colors.primary.main,
  },
});