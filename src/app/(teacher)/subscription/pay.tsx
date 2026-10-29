import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { paymentService } from '@/services/payment.service';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { theme } from '@/theme';

export default function ManualPaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ plan?: string }>();

  const planType: 'monthly' | 'yearly' = params.plan === 'yearly' ? 'yearly' : 'monthly';
  const planConfig = SUBSCRIPTION_PLANS[planType];

  const upiConfig = useMemo(() => paymentService.getUpiConfig(), []);
  const initialPaymentRef = useMemo(() => paymentService.generatePaymentReference(), []);

  const [transactionRef, setTransactionRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleSubmit = async () => {
    const cleanRef = transactionRef.trim().toUpperCase();

    if (!cleanRef) {
      setInputError('Please enter your 12-digit UPI transaction reference or UTR number.');
      return;
    }

    if (cleanRef.length < 6) {
      setInputError('Transaction reference must be at least 6 characters long.');
      return;
    }

    setInputError(null);
    setIsSubmitting(true);

    try {
      const request = await paymentService.submitPaymentRequest(planType, cleanRef);
      Alert.alert(
        'Payment Submitted! ⏳',
        `Your payment request (Ref: ${request.paymentReference}) has been registered. Our admin team will verify the bank transaction and activate your Pro subscription promptly.`,
        [
          {
            text: 'Track Status',
            onPress: () => router.replace('/(teacher)/subscription/status'),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        'Submission Failed',
        err.message || 'Unable to submit payment request. Please verify the transaction reference and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Manual UPI Payment"
          subtitle="Pay directly via any UPI app & submit your UTR"
          showBackButton
          onBackPress={() => router.back()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
        >
          {/* 1. Plan & Amount Summary Card */}
          <Card variant="elevated" padding="md" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text variant="caption" style={styles.summaryPlanLabel}>
                  SELECTED PLAN
                </Text>
                <Text variant="heading" style={styles.summaryPlanTitle}>
                  {planConfig.name}
                </Text>
                <Text variant="caption" style={styles.summaryDuration}>
                  Duration: {planConfig.durationDays} days
                </Text>
              </View>

              <View style={styles.amountBox}>
                <Text variant="caption" style={styles.amountLabel}>
                  Total Amount
                </Text>
                <Text style={styles.amountValue}>
                  ₹{planConfig.priceInRupees.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </Card>

          {/* 2. Official UPI ID & Payee Box */}
          <Card variant="outlined" padding="lg" style={styles.upiCard}>
            <View style={styles.upiCardHeader}>
              <View style={styles.upiIconCircle}>
                <Feather name="smartphone" size={20} color={theme.colors.primary.main} />
              </View>
              <View style={styles.upiCardMeta}>
                <Text variant="heading" style={styles.upiCardTitle}>
                  Official Payment Details
                </Text>
                <Text variant="caption" style={styles.upiCardSub}>
                  Payee: {upiConfig.payeeName}
                </Text>
              </View>
            </View>

            {/* UPI ID Field with Copy */}
            <View style={styles.copyBox}>
              <View style={styles.copyInfo}>
                <Text variant="caption" style={styles.copyLabel}>
                  UPI ID (VPA)
                </Text>
                <Text style={styles.copyValue}>{upiConfig.upiId}</Text>
              </View>
              <Pressable
                onPress={() => handleCopy(upiConfig.upiId, 'upi')}
                style={[
                  styles.copyBtn,
                  copiedField === 'upi' && styles.copyBtnSuccess,
                ]}
              >
                <Feather
                  name={copiedField === 'upi' ? 'check' : 'copy'}
                  size={15}
                  color={copiedField === 'upi' ? '#16A34A' : theme.colors.primary.main}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copiedField === 'upi' && styles.copyBtnTextSuccess,
                  ]}
                >
                  {copiedField === 'upi' ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>
            </View>

            {/* Unique Reference Field with Copy */}
            <View style={styles.copyBox}>
              <View style={styles.copyInfo}>
                <Text variant="caption" style={styles.copyLabel}>
                  Payment Reference (Add in UPI note)
                </Text>
                <Text style={styles.copyValueRef}>{initialPaymentRef}</Text>
              </View>
              <Pressable
                onPress={() => handleCopy(initialPaymentRef, 'ref')}
                style={[
                  styles.copyBtn,
                  copiedField === 'ref' && styles.copyBtnSuccess,
                ]}
              >
                <Feather
                  name={copiedField === 'ref' ? 'check' : 'copy'}
                  size={15}
                  color={copiedField === 'ref' ? '#16A34A' : theme.colors.primary.main}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copiedField === 'ref' && styles.copyBtnTextSuccess,
                  ]}
                >
                  {copiedField === 'ref' ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* 3. Step-by-Step Instructions */}
          <Card variant="outlined" padding="md" style={styles.stepsCard}>
            <Text variant="heading" style={styles.stepsTitle}>
              How to Complete Your Payment
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>1</Text>
              </View>
              <Text variant="body" style={styles.stepText}>
                Open <Text style={styles.bold}>GPay, PhonePe, Paytm, BHIM</Text>, or your bank app.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>2</Text>
              </View>
              <Text variant="body" style={styles.stepText}>
                Send exactly <Text style={styles.bold}>₹{planConfig.priceInRupees}</Text> to UPI ID:{' '}
                <Text style={styles.bold}>{upiConfig.upiId}</Text>.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>3</Text>
              </View>
              <Text variant="body" style={styles.stepText}>
                Include <Text style={styles.bold}>{initialPaymentRef}</Text> in the remark/note.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>4</Text>
              </View>
              <Text variant="body" style={styles.stepText}>
                After payment, copy the <Text style={styles.bold}>12-digit UTR / UPI Ref ID</Text> from the bank receipt and paste it below.
              </Text>
            </View>
          </Card>

          {/* 4. Transaction Reference Form */}
          <Card variant="elevated" padding="lg" style={styles.formCard}>
            <Text variant="heading" style={styles.formTitle}>
              Submit Transaction Reference
            </Text>
            <Text variant="caption" style={styles.formSub}>
              Enter the bank transaction ID / UTR shown on your payment confirmation screen.
            </Text>

            <View style={styles.inputWrap}>
              <Text variant="label" style={styles.inputLabel}>
                UPI TRANSACTION REFERENCE / UTR *
              </Text>
              <View style={[styles.inputBox, inputError && styles.inputBoxError]}>
                <Feather name="hash" size={18} color={theme.colors.text.tertiary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 430512345678"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={transactionRef}
                  onChangeText={(text) => {
                    setTransactionRef(text);
                    if (inputError) setInputError(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={32}
                  editable={!isSubmitting}
                />
                {transactionRef.length > 0 && (
                  <Pressable onPress={() => setTransactionRef('')}>
                    <Feather name="x-circle" size={16} color={theme.colors.text.tertiary} />
                  </Pressable>
                )}
              </View>
              {inputError && (
                <Text variant="caption" style={styles.errorText}>
                  {inputError}
                </Text>
              )}
            </View>

            <Button
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleSubmit}
              style={styles.submitBtn}
            >
              Submit for Verification
            </Button>
          </Card>

          {/* 5. Zero-Credentials Security Guarantee */}
          <View style={styles.securityBox}>
            <Feather name="lock" size={16} color={theme.colors.semantic.success.main} />
            <Text variant="caption" style={styles.securityText}>
              Security Guarantee: EduFlow only records the reference number for bank reconciliation. We never collect or store your UPI PIN, banking passwords, or card credentials.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryPlanLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  summaryPlanTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  summaryDuration: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.primary.main,
    marginTop: 2,
  },
  upiCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  upiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  upiIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiCardMeta: {
    flex: 1,
  },
  upiCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  upiCardSub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  copyInfo: {
    flex: 1,
  },
  copyLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  copyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  copyValueRef: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary.bg,
    borderRadius: 8,
  },
  copyBtnSuccess: {
    backgroundColor: '#DCFCE7',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  copyBtnTextSuccess: {
    color: '#16A34A',
  },
  stepsCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary.main,
  },
  stepText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    lineHeight: 19,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  formCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  formSub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 17,
  },
  inputWrap: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputBoxError: {
    borderColor: theme.colors.semantic.danger.main,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorText: {
    color: theme.colors.semantic.danger.main,
    marginTop: 4,
    fontSize: 12,
  },
  submitBtn: {
    width: '100%',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 8,
  },
  securityText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 16,
    flex: 1,
  },
});
