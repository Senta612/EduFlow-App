import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
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
import { useSubscription } from '@/hooks/useSubscription';
import { paymentService } from '@/services/payment.service';
import { PaymentRequest, SUBSCRIPTION_PLANS } from '@/types/subscription';
import { theme } from '@/theme';

export default function SubscriptionOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    subscription,
    isPro,
    isTrial,
    isExpired,
    isTrialEligible,
    daysRemaining,
    expiryDateFormatted,
    pendingRequest,
    isLoading,
    refresh,
    startTrial,
  } = useSubscription();

  const [paymentHistory, setPaymentHistory] = useState<PaymentRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const whatsAppConfig = paymentService.getWhatsAppConfig();

  const loadHistory = useCallback(async () => {
    try {
      const history = await paymentService.getTeacherPaymentRequests();
      setPaymentHistory(history);
    } catch (e) {
      console.warn('Failed to load payment history:', e);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), loadHistory()]);
    setIsRefreshing(false);
  }, [refresh, loadHistory]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      await startTrial();
      Alert.alert(
        'Pro Trial Activated! 🎉',
        'Welcome to EduFlow Pro! You now have full 30 days of unlimited access to all features.',
        [{ text: 'Awesome', style: 'default' }],
      );
    } catch (err: any) {
      Alert.alert('Trial Error', err.message || 'Unable to start trial. Please try again.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const getStatusBadgeVariant = () => {
    if (isPro) {
      return isTrial ? 'primary' : 'success';
    }
    if (isExpired) return 'danger';
    if (pendingRequest) return 'warning';
    return 'neutral';
  };

  const getStatusLabel = () => {
    if (isPro) {
      return isTrial ? 'Free Trial' : 'Pro Active';
    }
    if (isExpired) return 'Expired';
    if (pendingRequest) return 'Verification Pending';
    return 'No Active Plan';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Subscription & Plans"
        subtitle="Manage your EduFlow Pro access & billing"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
          />
        }
      >
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="caption" style={styles.loadingText}>
              Loading subscription details...
            </Text>
          </View>
        ) : (
          <>
            {/* 1. Pending Payment Notice (If applicable) */}
            {pendingRequest && (
              <Card variant="outlined" padding="md" style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={styles.pendingIconBox}>
                    <Feather name="clock" size={20} color={theme.colors.semantic.warning.main} />
                  </View>
                  <View style={styles.pendingMeta}>
                    <Text variant="heading" style={styles.pendingTitle}>
                      Payment Verification In Progress
                    </Text>
                    <Text variant="caption" style={styles.pendingSubtitle}>
                      Reference: {pendingRequest.paymentReference}
                    </Text>
                  </View>
                  <Badge label="Pending" variant="warning" size="sm" />
                </View>

                <Text variant="body" style={styles.pendingBody}>
                  We received your manual UPI payment (UTR: {pendingRequest.transactionReference}). Our team is reviewing the bank record. Pro will activate immediately upon verification.
                </Text>

                <Button
                  title="View Payment Status"
                  variant="outline"
                  size="sm"
                  onPress={() => router.push('/(teacher)/subscription/status')}
                  style={styles.pendingButton}
                />
              </Card>
            )}

            {/* 2. Primary Status Hero Card */}
            <Card variant="elevated" padding="lg" style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.planBadgeContainer}>
                  <Badge
                    label={getStatusLabel()}
                    variant={getStatusBadgeVariant()}
                    size="md"
                  />
                  {subscription?.plan && (
                    <Text variant="caption" style={styles.planTypeLabel}>
                      {subscription.plan === 'yearly'
                        ? 'Yearly Plan'
                        : subscription.plan === 'monthly'
                        ? 'Monthly Plan'
                        : '30-Day Trial'}
                    </Text>
                  )}
                </View>

                <View style={styles.heroIconCircle}>
                  <Feather
                    name={isPro ? 'shield' : isExpired ? 'alert-circle' : 'star'}
                    size={24}
                    color={isPro ? theme.colors.primary.main : theme.colors.semantic.warning.main}
                  />
                </View>
              </View>

              {isPro ? (
                <View style={styles.activeDetailsContainer}>
                  <View style={styles.countdownRow}>
                    <Text variant="title" style={styles.daysCountText}>
                      {daysRemaining}
                    </Text>
                    <View style={styles.daysLabelBox}>
                      <Text variant="heading" style={styles.daysLeftTitle}>
                        Days Remaining
                      </Text>
                      <Text variant="caption" style={styles.expiryDateSub}>
                        Valid until {expiryDateFormatted}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              ((daysRemaining) /
                                (subscription?.plan === 'yearly' ? 365 : 30)) *
                                100,
                            ),
                          )}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.ctaRow}>
                    <Button
                      title="Extend / Renew Plan"
                      variant="primary"
                      size="md"
                      onPress={() => router.push('/(teacher)/subscription/plans')}
                      style={styles.fullWidthBtn}
                    />
                  </View>
                </View>
              ) : isExpired ? (
                <View style={styles.expiredContainer}>
                  <Text variant="heading" style={styles.expiredTitle}>
                    Your Pro Access Has Expired
                  </Text>
                  <Text variant="body" style={styles.expiredDesc}>
                    All your existing batches, students, past attendance, and homework records remain 100% safe. Renew your plan to continue creating batches and sharing materials.
                  </Text>
                  <Button
                    title="Renew Subscription Now"
                    variant="primary"
                    size="md"
                    onPress={() => router.push('/(teacher)/subscription/plans')}
                    style={styles.fullWidthBtn}
                  />
                </View>
              ) : isTrialEligible ? (
                <View style={styles.trialEligibleContainer}>
                  <Text variant="heading" style={styles.trialTitle}>
                    Try EduFlow Pro Free for 30 Days
                  </Text>
                  <Text variant="body" style={styles.trialDesc}>
                    Full access to unlimited student batches, automated WhatsApp reports, fee ledger, and study material uploads. No credit card required.
                  </Text>
                  <Button
                    title="Start 30-Day Free Trial"
                    variant="primary"
                    size="md"
                    loading={isStartingTrial}
                    onPress={handleStartTrial}
                    style={styles.fullWidthBtn}
                  />
                </View>
              ) : (
                <View style={styles.noPlanContainer}>
                  <Text variant="heading" style={styles.trialTitle}>
                    Choose an EduFlow Pro Plan
                  </Text>
                  <Text variant="body" style={styles.trialDesc}>
                    Unlock powerful teaching tools for your tuition center or private coaching classes.
                  </Text>
                  <Button
                    title="View Available Plans"
                    variant="primary"
                    size="md"
                    onPress={() => router.push('/(teacher)/subscription/plans')}
                    style={styles.fullWidthBtn}
                  />
                </View>
              )}
            </Card>

            {/* 3. Pro Feature Highlights */}
            <View style={styles.section}>
              <Text variant="heading" style={styles.sectionTitle}>
                What&apos;s Included in Pro
              </Text>
              <Card variant="outlined" padding="md" style={styles.featuresCard}>
                {SUBSCRIPTION_PLANS.monthly.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <View style={styles.featureCheck}>
                      <Feather name="check" size={14} color={theme.colors.semantic.success.main} />
                    </View>
                    <Text variant="body" style={styles.featureText}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>

            {/* 4. WhatsApp Support & Claims */}
            <Card variant="outlined" padding="md" style={styles.whatsAppCard}>
              <View style={styles.whatsAppHeader}>
                <View style={styles.whatsAppIconWrap}>
                  <Feather name="message-circle" size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="heading" style={styles.whatsAppTitle}>
                    WhatsApp Direct Claims & Support
                  </Text>
                  <Text variant="caption" style={styles.whatsAppSub}>
                    Prefer manual UPI payment or need immediate account activation? Contact our team directly on WhatsApp.
                  </Text>
                  <Text style={styles.whatsAppPhone}>
                    WhatsApp: {whatsAppConfig.formatted} ({whatsAppConfig.number})
                  </Text>
                </View>
              </View>
              <Button
                title={`Chat on WhatsApp (${whatsAppConfig.number})`}
                variant="outline"
                size="md"
                onPress={() => paymentService.openWhatsAppClaim()}
                style={styles.whatsAppBtn}
              />
            </Card>

            {/* 5. Payment & Request History */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="heading" style={styles.sectionTitle}>
                  Payment History
                </Text>
                <Pressable onPress={() => router.push('/(teacher)/subscription/plans')}>
                  <Text variant="caption" style={styles.viewPlansLink}>
                    Buy Plan
                  </Text>
                </Pressable>
              </View>

              {paymentHistory.length === 0 ? (
                <Card variant="outlined" padding="lg" style={styles.emptyHistoryCard}>
                  <Feather name="file-text" size={32} color={theme.colors.text.tertiary} />
                  <Text variant="caption" style={styles.emptyHistoryText}>
                    No payment requests yet. When you submit a manual payment reference, it will appear here.
                  </Text>
                </Card>
              ) : (
                <View style={styles.historyList}>
                  {paymentHistory.map((item) => (
                    <Card
                      key={item.id}
                      variant="outlined"
                      padding="md"
                      style={styles.historyCard}
                      onPress={() => router.push('/(teacher)/subscription/status')}
                    >
                      <View style={styles.historyHeader}>
                        <View>
                          <Text variant="heading" style={styles.historyPlan}>
                            {item.plan === 'yearly' ? 'Pro Yearly (₹4,999)' : 'Pro Monthly (₹499)'}
                          </Text>
                          <Text variant="caption" style={styles.historyRef}>
                            Ref: {item.paymentReference}
                          </Text>
                        </View>
                        <Badge
                          label={
                            item.status === 'approved'
                              ? 'Approved'
                              : item.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'
                          }
                          variant={
                            item.status === 'approved'
                              ? 'success'
                              : item.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        />
                      </View>

                      <View style={styles.historyFooter}>
                        <Text variant="caption" style={styles.historyUtr}>
                          UTR: {item.transactionReference}
                        </Text>
                        <Text variant="caption" style={styles.historyDate}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>

                      {item.status === 'rejected' && item.rejectionReason && (
                        <View style={styles.rejectionBox}>
                          <Feather name="info" size={13} color={theme.colors.semantic.danger.main} />
                          <Text variant="caption" style={styles.rejectionText}>
                            Reason: {item.rejectionReason}
                          </Text>
                        </View>
                      )}
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
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
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  pendingCard: {
    backgroundColor: theme.colors.semantic.warning.bg,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pendingMeta: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingSubtitle: {
    color: '#B45309',
    fontSize: 12,
  },
  pendingBody: {
    color: '#78350F',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  pendingButton: {
    alignSelf: 'flex-start',
    borderColor: '#D97706',
  },
  heroCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTypeLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDetailsContainer: {
    gap: 14,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  daysCountText: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.primary.main,
    lineHeight: 52,
  },
  daysLabelBox: {
    flex: 1,
  },
  daysLeftTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  expiryDateSub: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 4,
  },
  ctaRow: {
    marginTop: 6,
  },
  fullWidthBtn: {
    width: '100%',
  },
  expiredContainer: {
    gap: 10,
  },
  expiredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.semantic.danger.main,
  },
  expiredDesc: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  trialEligibleContainer: {
    gap: 10,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  trialDesc: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  noPlanContainer: {
    gap: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewPlansLink: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: theme.colors.background.paper,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.semantic.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  emptyHistoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    maxWidth: 260,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: theme.colors.background.paper,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyPlan: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  historyRef: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border.light,
    paddingTop: 8,
  },
  historyUtr: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.semantic.danger.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rejectionText: {
    color: theme.colors.semantic.danger.main,
    fontSize: 12,
  },
  whatsAppCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
    borderRadius: 16,
    gap: 12,
  },
  whatsAppHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  whatsAppIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  whatsAppSub: {
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
  whatsAppBtn: {
    width: '100%',
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
  },
});
