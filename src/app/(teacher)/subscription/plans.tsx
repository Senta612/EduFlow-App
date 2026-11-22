import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { paymentService } from '@/services/payment.service';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { theme } from '@/theme';

export default function SubscriptionPlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { isTrialEligible, startTrial } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const whatsAppConfig = paymentService.getWhatsAppConfig();

  const handleClaimViaWhatsApp = (plan: 'monthly' | 'yearly') => {
    paymentService.openWhatsAppClaim({
      plan,
      teacherName: profile?.full_name || undefined,
    });
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      await startTrial();
      Alert.alert(
        'Trial Activated! 🎉',
        'Your 30-day Pro trial is now active. Enjoy all EduFlow features!',
        [{ text: 'Get Started', onPress: () => router.replace('/(teacher)/subscription') }],
      );
    } catch (err: any) {
      Alert.alert('Trial Activation', err.message || 'Failed to activate trial.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleProceedToPayment = (plan: 'monthly' | 'yearly') => {
    router.push({
      pathname: '/(teacher)/subscription/pay',
      params: { plan },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Choose a Plan"
        subtitle="Transparent pricing. Manual UPI verification. No recurring traps."
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 36 },
        ]}
      >
        {/* 1. Free Trial Card if eligible */}
        {isTrialEligible && (
          <Card variant="outlined" padding="lg" style={styles.trialCard}>
            <View style={styles.trialHeader}>
              <View>
                <Badge label="100% Free" variant="success" size="sm" />
                <Text variant="heading" style={styles.trialTitle}>
                  30-Day Pro Free Trial
                </Text>
              </View>
              <Feather name="gift" size={32} color={theme.colors.semantic.success.main} />
            </View>
            <Text variant="body" style={styles.trialSubtitle}>
              New to EduFlow? Try everything free for a whole month with zero upfront payment.
            </Text>
            <Button
              title="Start 30-Day Free Trial"
              variant="outline"
              size="md"
              loading={isStartingTrial}
              onPress={handleStartTrial}
              style={styles.trialButton}
            />
          </Card>
        )}

        {/* 2. Plan Comparison Header */}
        <View style={styles.sectionHeader}>
          <Text variant="heading" style={styles.sectionTitle}>
            Paid Subscription Plans
          </Text>
          <Text variant="caption" style={styles.sectionSubtitle}>
            Extend early without losing any remaining days.
          </Text>
        </View>

        {/* 3. Yearly Plan Card (Best Value) */}
        <Pressable onPress={() => setSelectedPlan('yearly')}>
          <Card
            variant="elevated"
            padding="lg"
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlanCard,
            ]}
          >
            {/* Top Right Best Value Highlight Badge */}
            <View style={styles.cardBadgeRow}>
              <View style={styles.popularBadge}>
                <Feather name="zap" size={11} color="#FFFFFF" />
                <Text style={styles.popularBadgeText}>BEST VALUE — SAVE 17%</Text>
              </View>
            </View>

            <View style={styles.planHeaderRow}>
              <View style={styles.planTitleBox}>
                <Text variant="heading" style={styles.planName}>
                  Pro Yearly
                </Text>
                <Text variant="caption" style={styles.planDuration}>
                  365 Days Access (~₹416/mo)
                </Text>
              </View>

              <View style={styles.radioOuter}>
                {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.priceMain}>4,999</Text>
              <Text style={styles.periodText}>/ 365 days</Text>
            </View>

            <Text variant="caption" style={styles.planDesc}>
              {SUBSCRIPTION_PLANS.yearly.description}
            </Text>

            <View style={styles.featuresList}>
              {SUBSCRIPTION_PLANS.yearly.features.map((feat, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Feather name="check" size={15} color={theme.colors.primary.main} />
                  <Text variant="body" style={styles.featureText}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Button
                title="Pay via UPI (₹4,999)"
                variant={selectedPlan === 'yearly' ? 'primary' : 'outline'}
                size="md"
                onPress={() => handleProceedToPayment('yearly')}
                style={styles.flexBtn}
              />
              <Pressable
                style={styles.whatsAppActionBtn}
                onPress={() => handleClaimViaWhatsApp('yearly')}
                accessibilityRole="button"
                accessibilityLabel="Claim Yearly via WhatsApp"
              >
                <Feather name="message-circle" size={17} color="#16A34A" />
                <Text style={styles.whatsAppActionText}>WhatsApp</Text>
              </Pressable>
            </View>
          </Card>
        </Pressable>

        {/* 4. Monthly Plan Card */}
        <Pressable onPress={() => setSelectedPlan('monthly')}>
          <Card
            variant="elevated"
            padding="lg"
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlanCard,
            ]}
          >
            <View style={styles.planHeaderRow}>
              <View style={styles.planTitleBox}>
                <Text variant="heading" style={styles.planName}>
                  Pro Monthly
                </Text>
                <Text variant="caption" style={styles.planDuration}>
                  30 Days Access
                </Text>
              </View>

              <View style={styles.radioOuter}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.priceMain}>499</Text>
              <Text style={styles.periodText}>/ 30 days</Text>
            </View>

            <Text variant="caption" style={styles.planDesc}>
              {SUBSCRIPTION_PLANS.monthly.description}
            </Text>

            <View style={styles.featuresList}>
              {SUBSCRIPTION_PLANS.monthly.features.map((feat, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Feather name="check" size={15} color={theme.colors.primary.main} />
                  <Text variant="body" style={styles.featureText}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Button
                title="Pay via UPI (₹499)"
                variant={selectedPlan === 'monthly' ? 'primary' : 'outline'}
                size="md"
                onPress={() => handleProceedToPayment('monthly')}
                style={styles.flexBtn}
              />
              <Pressable
                style={styles.whatsAppActionBtn}
                onPress={() => handleClaimViaWhatsApp('monthly')}
                accessibilityRole="button"
                accessibilityLabel="Claim Monthly via WhatsApp"
              >
                <Feather name="message-circle" size={17} color="#16A34A" />
                <Text style={styles.whatsAppActionText}>WhatsApp</Text>
              </Pressable>
            </View>
          </Card>
        </Pressable>

        {/* 5. Claim via WhatsApp Card */}
        <Card variant="outlined" padding="md" style={styles.whatsAppCard}>
          <View style={styles.whatsAppCardContent}>
            <View style={styles.whatsAppIconWrap}>
              <Feather name="message-circle" size={24} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading" style={styles.whatsAppCardTitle}>
                Claim & Activate via WhatsApp
              </Text>
              <Text variant="caption" style={styles.whatsAppCardSub}>
                Prefer direct WhatsApp payment, custom invoice, or fast account activation?
              </Text>
              <Text style={styles.whatsAppPhone}>
                WhatsApp: {whatsAppConfig.formatted} ({whatsAppConfig.number})
              </Text>
            </View>
          </View>
          <Button
            title={`Claim on WhatsApp (${whatsAppConfig.number})`}
            variant="outline"
            size="md"
            onPress={() => handleClaimViaWhatsApp(selectedPlan)}
            style={styles.whatsAppMainBtn}
          />
        </Card>

        {/* 6. Assurance & FAQ Notice */}
        <Card variant="outlined" padding="md" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="shield" size={18} color={theme.colors.primary.main} />
            <Text variant="heading" style={styles.infoTitle}>
              Transparent Payment Policy
            </Text>
          </View>
          <Text variant="caption" style={styles.infoText}>
            • Manual verification only: You pay directly via UPI (Google Pay, PhonePe, Paytm, etc.).
          </Text>
          <Text variant="caption" style={styles.infoText}>
            • No auto-debit: We never save bank passwords, cards, or schedule unauthorized recurring charges.
          </Text>
          <Text variant="caption" style={styles.infoText}>
            • Student privacy & free access: Students join your batches completely free of charge.
          </Text>
        </Card>
      </ScrollView>
    </View>
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
  trialCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    marginBottom: 20,
    gap: 10,
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginTop: 4,
  },
  trialSubtitle: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
  },
  trialButton: {
    alignSelf: 'flex-start',
    borderColor: '#16A34A',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  planCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: theme.colors.border.main,
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.bg,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitleBox: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  planDuration: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary.main,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginRight: 2,
  },
  priceMain: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.text.primary,
  },
  periodText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  planDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  featuresList: {
    gap: 10,
    marginBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border.light,
    paddingTop: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectButton: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexBtn: {
    flex: 1,
  },
  whatsAppActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 48,
  },
  whatsAppActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  whatsAppCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 12,
  },
  whatsAppCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  whatsAppIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  whatsAppCardSub: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 17,
    marginTop: 2,
  },
  whatsAppPhone: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  whatsAppMainBtn: {
    width: '100%',
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: theme.colors.background.paper,
    marginTop: 6,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
});
