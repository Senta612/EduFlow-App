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
import { getFriendlyAuthMessage, signUp } from '@/services/auth.service';
import { theme } from '@/theme';
import { SignupFormData, signupSchema } from '@/types/auth';

type Role = 'teacher' | 'student';

const ROLE_OPTIONS: { value: Role; label: string; icon: keyof typeof Feather.glyphMap; description: string }[] = [
  {
    value: 'teacher',
    label: 'Teacher',
    icon: 'book-open',
    description: 'Manage batches & students',
  },
  {
    value: 'student',
    label: 'Student',
    icon: 'user',
    description: 'Track tests & homework',
  },
];

export default function SignupScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'teacher',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setSubmitError(null);

    const { error, errorKind } = await signUp(data);

    if (error || errorKind) {
      setSubmitError(getFriendlyAuthMessage(errorKind ?? 'unknown'));
      return;
    }
    // AuthProvider will detect the session change and RootNavigator will route
    // the user directly to their respective role dashboard.
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="title" style={styles.title}>
            Create Account
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Join EduFlow to organize and manage your tuition
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleSection}>
                <Text variant="label" style={styles.roleLabel}>
                  I am registering as:
                </Text>
                <View style={styles.roleRow}>
                  {ROLE_OPTIONS.map((option) => {
                    const isSelected = value === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        style={[
                          styles.roleCard,
                          isSelected && styles.roleCardSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.roleIconContainer,
                            isSelected && styles.roleIconContainerSelected,
                          ]}
                        >
                          <Feather
                            name={option.icon}
                            size={20}
                            color={
                              isSelected
                                ? theme.colors.primary.main
                                : theme.colors.text.secondary
                            }
                          />
                        </View>
                        <View style={styles.roleTextWrapper}>
                          <Text
                            variant="label"
                            style={[
                              styles.roleOptionText,
                              isSelected && styles.roleOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text
                            variant="caption"
                            style={styles.roleOptionSubtext}
                            numberOfLines={1}
                          >
                            {option.description}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.role?.message && (
                  <Text variant="caption" style={styles.fieldError}>
                    {errors.role.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="e.g. John Doe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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
                label="Confirm Password"
                placeholder="Re-enter your password"
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

          {submitError && (
            <View style={styles.errorBanner}>
              <Feather
                name="alert-circle"
                size={18}
                color={theme.colors.semantic.danger.main}
              />
              <Text variant="caption" style={styles.errorBannerText}>
                {submitError}
              </Text>
            </View>
          )}

          <Button
            title={isSubmitting ? 'Creating Account...' : 'Create Account'}
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text variant="body" style={styles.switchText}>
            Already have an account?
          </Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text variant="label" style={styles.switchLink}>
              Sign in
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
    gap: theme.spacing.lg,
  },

  header: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },

  title: {
    color: theme.colors.text.primary,
  },

  subtitle: {
    color: theme.colors.text.secondary,
  },

  form: {
    gap: theme.spacing.md,
  },

  roleSection: {
    gap: theme.spacing.xs,
  },

  roleLabel: {
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.lg,
    gap: theme.spacing.xs + 2,
  },

  roleCardSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },

  roleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleIconContainerSelected: {
    backgroundColor: '#E0E7FF',
  },

  roleTextWrapper: {
    flex: 1,
  },

  roleOptionText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
  },

  roleOptionTextSelected: {
    color: theme.colors.primary.main,
  },

  roleOptionSubtext: {
    color: theme.colors.text.tertiary ?? theme.colors.text.secondary,
    fontSize: 10,
    lineHeight: 13,
  },

  fieldError: {
    color: theme.colors.semantic.danger.main,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.semantic.danger.bg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    gap: theme.spacing.xs + 2,
  },

  errorBannerText: {
    flex: 1,
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.medium,
  },

  submitButton: {
    marginTop: theme.spacing.xs,
  },

  eyeButton: {
    padding: theme.spacing.xs,
  },

  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },

  switchText: {
    color: theme.colors.text.secondary,
  },

  switchLink: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
});