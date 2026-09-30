import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmailConfirmationModal } from '@/components/ui/EmailConfirmationModal';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { getFriendlyAuthMessage, signIn } from '@/services/auth.service';
import { theme } from '@/theme';
import { LoginFormData, loginSchema } from '@/types/auth';

type AuthMode = 'teacher' | 'student';

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('teacher');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');

  // Student portal state
  const [studentCode, setStudentCode] = useState('');
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const { loginWithStudentCode } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmitTeacher = async (data: LoginFormData) => {
    setLoginError(null);

    const { error, errorKind } = await signIn(data.email, data.password);

    if (error || errorKind) {
      if (errorKind === 'email_not_confirmed') {
        setUnconfirmedEmail(data.email.trim());
        setShowConfirmModal(true);
      }
      setLoginError(getFriendlyAuthMessage(errorKind ?? 'unknown'));
      return;
    }
  };

  const handleStudentSubmit = async () => {
    if (!studentCode.trim()) {
      setStudentError('Please enter your student invite code.');
      return;
    }

    setStudentError(null);
    setIsStudentSubmitting(true);

    try {
      const res = await loginWithStudentCode(studentCode.trim());
      if (res.success) {
        router.replace('/(student)');
      } else {
        setStudentError(res.error || 'Invalid invite code. Please check with your teacher.');
      }
    } catch {
      setStudentError('Failed to verify code. Please try again.');
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const handlePasteStudentCode = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setStudentCode(text.trim());
        setStudentError(null);
        return;
      }
    } catch {
      // Fallback
    }

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setStudentCode(text.trim());
          setStudentError(null);
        }
      }
    } catch {
      // ignore
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
        {/* Role Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, authMode === 'teacher' && styles.tabBtnActive]}
            onPress={() => {
              setAuthMode('teacher');
              setLoginError(null);
            }}
            activeOpacity={0.8}
          >
            <Feather
              name="user"
              size={15}
              color={authMode === 'teacher' ? '#FFFFFF' : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                authMode === 'teacher' && styles.tabBtnTextActive,
              ]}
            >
              Teacher Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, authMode === 'student' && styles.tabBtnActive]}
            onPress={() => {
              setAuthMode('student');
              setStudentError(null);
            }}
            activeOpacity={0.8}
          >
            <Feather
              name="award"
              size={15}
              color={authMode === 'student' ? '#FFFFFF' : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                authMode === 'student' && styles.tabBtnTextActive,
              ]}
            >
              Student Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Mode Content */}
        {authMode === 'teacher' ? (
          <>
            <View style={styles.header}>
              <Text variant="title">Teacher Sign In</Text>
              <Text variant="body" style={styles.subtitle}>
                Sign in to manage batches, attendance, and student performance
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
                title="Login as Teacher"
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit(onSubmitTeacher)}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text variant="body" style={styles.switchText}>
                New teacher?
              </Text>
              <Pressable onPress={() => router.replace('/signup')} hitSlop={8}>
                <Text variant="label" style={styles.switchLink}>
                  Create an account
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          /* Student Zero-Login Mode */
          <>
            <View style={styles.header}>
              <Text variant="title">Student Access</Text>
              <Text variant="body" style={styles.subtitle}>
                No password required! Enter your invite code or link shared by your teacher.
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Student Invite Code / Link"
                placeholder="e.g. STU-9K3E8R"
                value={studentCode}
                onChangeText={(text) => {
                  setStudentCode(text);
                  if (studentError) setStudentError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                error={studentError || undefined}
                rightContent={
                  <TouchableOpacity
                    onPress={handlePasteStudentCode}
                    hitSlop={8}
                    style={styles.pasteBtn}
                  >
                    <Feather name="clipboard" size={14} color={theme.colors.primary.main} />
                    <Text style={styles.pasteBtnText}>Paste</Text>
                  </TouchableOpacity>
                }
              />

              <Button
                title="Enter Student Portal"
                icon="arrow-right"
                fullWidth
                loading={isStudentSubmitting}
                onPress={handleStudentSubmit}
              />

              <View style={styles.studentHelpBox}>
                <Feather name="info" size={15} color="#047857" />
                <Text style={styles.studentHelpText}>
                  Your teacher provides your unique 6-character code or WhatsApp link. No registration needed.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <EmailConfirmationModal
        visible={showConfirmModal}
        email={unconfirmedEmail}
        onClose={() => setShowConfirmModal(false)}
        onGoToLogin={() => setShowConfirmModal(false)}
      />
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

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    marginBottom: theme.spacing.xs,
  },

  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },

  tabBtnActive: {
    backgroundColor: theme.colors.primary.main,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  header: {
    gap: theme.spacing.xs,
  },

  subtitle: {
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  form: {
    gap: theme.spacing.md,
  },

  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary.main + '12',
  },

  pasteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },

  studentHelpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: theme.radii.md,
  },

  studentHelpText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
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