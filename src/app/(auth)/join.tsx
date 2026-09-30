import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function JoinPortalScreen() {
  const params = useLocalSearchParams<{ code?: string; token?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginWithStudentCode } = useAuth();

  const [inviteCode, setInviteCode] = useState(params.code || params.token || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ studentName: string; batchName: string } | null>(null);

  useEffect(() => {
    const initialCode = params.code || params.token;
    if (initialCode) {
      handleJoin(initialCode);
    }
  }, [params.code, params.token]);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInviteCode(text.trim());
        setErrorMessage(null);
        return;
      }
    } catch {
      // Fallback
    }

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInviteCode(text.trim());
          setErrorMessage(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleJoin = async (codeToUse?: string) => {
    const targetCode = (codeToUse || inviteCode).trim();
    if (!targetCode) {
      setErrorMessage('Please enter your student invite code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginWithStudentCode(targetCode);

      if (result.success && result.session) {
        setSuccessInfo({
          studentName: result.session.name,
          batchName: result.session.batchName || 'Class Batch',
        });

        // Brief delay to show welcome banner then transition to student dashboard
        setTimeout(() => {
          router.replace('/(student)');
        }, 1200);
      } else {
        setErrorMessage(
          result.error ||
            'Invalid or expired invite code. Please check with your teacher for a fresh link.'
        );
      }
    } catch (err: any) {
      console.error('Failed to join student portal:', err);
      setErrorMessage('Unable to connect right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back / Header Row */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(auth)/login')}
            hitSlop={10}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text variant="caption" style={styles.badgeText}>
            STUDENT & PARENT ACCESS
          </Text>
        </View>

        {/* Hero Visual Icon */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Feather name="book-open" size={32} color={theme.colors.primary.main} />
          </View>
          <Text variant="title" style={styles.title}>
            Join Student Portal
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Enter the invite code or link provided by your teacher to view attendance, homework, and test marks.
          </Text>
        </View>

        {/* Success Confirmation State */}
        {successInfo ? (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <Feather name="check" size={24} color="#16A34A" />
            </View>
            <Text style={styles.successTitle}>Welcome, {successInfo.studentName}! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Connected to <Text style={{ fontWeight: '700' }}>{successInfo.batchName}</Text>. Loading your dashboard...
            </Text>
            <ActivityIndicator
              size="small"
              color="#16A34A"
              style={{ marginTop: 8 }}
            />
          </View>
        ) : (
          /* Input Form */
          <View style={styles.formContainer}>
            <View style={styles.inputWrap}>
              <Input
                label="Student Invite Code / Link"
                placeholder="e.g. STU-9K3E8R"
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                error={errorMessage || undefined}
                rightContent={
                  <TouchableOpacity
                    onPress={handlePaste}
                    hitSlop={8}
                    style={styles.pasteBtn}
                  >
                    <Feather name="clipboard" size={16} color={theme.colors.primary.main} />
                    <Text style={styles.pasteBtnText}>Paste</Text>
                  </TouchableOpacity>
                }
              />
            </View>

            <Button
              title="Enter Student Portal"
              icon="arrow-right"
              fullWidth
              loading={isLoading}
              onPress={() => handleJoin()}
            />

            {/* Help Callout */}
            <View style={styles.helpBox}>
              <Feather name="info" size={16} color={theme.colors.text.secondary} />
              <Text variant="caption" style={styles.helpText}>
                No email or password needed! Your teacher creates your unique access link when adding you to the batch.
              </Text>
            </View>
          </View>
        )}

        {/* Switch back to Teacher login */}
        <View style={styles.switchContainer}>
          <Text variant="body" style={styles.switchText}>
            Are you a Teacher?
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
            <Text variant="label" style={styles.switchLink}>
              Teacher Sign In
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
    gap: theme.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary.main + '15',
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main + '35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  formContainer: {
    gap: 16,
  },
  inputWrap: {
    position: 'relative',
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
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.background.paper,
    padding: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  successCard: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: theme.radii.xl,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  successIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.md,
  },
  switchText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  switchLink: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 13,
  },
});
