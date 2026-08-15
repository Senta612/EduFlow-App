import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';
import { SignupFormData, signupSchema } from '@/types/auth';

type Role = 'teacher' | 'student';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

export function SignupScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
        },
      },
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    // Signup successful - email confirmation may be required.
    // The database trigger will create the profile row in `profiles`.
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
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
              secureTextEntry
              autoCapitalize="none"
              error={errors.password?.message}
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
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword?.message}
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
    </ScrollView>
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
});