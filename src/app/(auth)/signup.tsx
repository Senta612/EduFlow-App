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
import { signUp } from '@/services/auth.service';
import { theme } from '@/theme';
import { SignupFormData, signupSchema } from '@/types/auth';

type Role = 'teacher' | 'student';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
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
      role: 'student',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setSubmitError(null);

    const { error } = await signUp(data);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    // Signup successful - email confirmation may be required.
    // The database trigger will create the profile row in `profiles`.
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
          <Text variant="title">Create Account</Text>
          <Text variant="body" style={styles.subtitle}>
            Join EduFlow to start learning and teaching
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
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
                label="Email"
                placeholder="Enter your email"
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

          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleSection}>
                <Text variant="label" style={styles.roleLabel}>
                  I am a
                </Text>
                <View style={styles.roleRow}>
                  {ROLE_OPTIONS.map((option) => {
                    const isSelected = value === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        style={[
                          styles.roleOption,
                          isSelected && styles.roleOptionSelected,
                        ]}
                      >
                        <Text
                          variant="label"
                          style={[
                            styles.roleOptionText,
                            isSelected && styles.roleOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.role?.message && (
                  <Text variant="caption" style={styles.roleError}>
                    {errors.role.message}
                  </Text>
                )}
              </View>
            )}
          />

          {submitError && (
            <Text variant="caption" style={styles.submitError}>
              {submitError}
            </Text>
          )}

          <Button
            title="Create Account"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
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

  roleSection: {
    gap: theme.spacing.xs,
  },

  roleLabel: {
    color: theme.colors.text.primary,
  },

  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  roleOption: {
    flex: 1,
    minHeight: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,
  },

  roleOptionSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },

  roleOptionText: {
    color: theme.colors.text.secondary,
  },

  roleOptionTextSelected: {
    color: theme.colors.primary.main,
  },

  roleError: {
    color: theme.colors.semantic.danger.main,
  },

  submitError: {
    color: theme.colors.semantic.danger.main,
    textAlign: 'center',
  },

  eyeButton: {
    padding: theme.spacing.xs,
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