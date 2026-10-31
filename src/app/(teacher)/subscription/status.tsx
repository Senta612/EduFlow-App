import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Platform,
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
import { PaymentRequest } from '@/types/subscription';
import { theme } from '@/theme';

export default function PaymentStatusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh: refreshSubscription } = useSubscription();

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLatestRequest = useCallback(async () => {
    try {
      const requests = await paymentService.getTeacherPaymentRequests();
      setRequest(requests.length > 0 ? requests[0] : null);
    } catch (e) {
      console.warn('Failed to load payment status:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadLatestRequest(), refreshSubscription()]);
    setIsRefreshing(false);
  }, [loadLatestRequest, refreshSubscription]);

  useEffect(() => {
    loadLatestRequest();
  }, [loadLatestRequest]);

  const renderStatusBanner = () => {
    if (!request) {
      return (
        <Card variant="outlined" padding="lg" style={styles.statusBannerCard}>
          <Feather name="file-text" size={40} color={theme.colors.text.tertiary} />
          <Text variant="heading" style={styles.bannerTitle}>
            No Payment Request Found
          </Text>
          <Text variant="caption" style={styles.bannerSubtitle}>
            You don&apos;t have any pending payment requests.
          </Text>
          <Button
            title="View Subscription Plans"
            variant="primary"
            size="md"
            onPress={() => router.push('/(teacher)/subscription/plans')}
            style={styles.bannerBtn}
          />
        </Card>
      );
    }

    if (request.status === 'approved') {
      return (
        <Card variant="elevated" padding="lg" style={[styles.statusBannerCard, styles.approvedCard]}>
          <View style={[styles.iconCircle, styles.approvedCircle]}>
            <Feather name="check" size={32} color={theme.colors.semantic.success.main} />
          </View>
          <Text variant="heading" style={[styles.bannerTitle, styles.approvedTitle]}>
            Payment Verified & Approved! 🎉
          </Text>
          <Text variant="body" style={styles.bannerSubtitle}>
            Your {request.plan === 'yearly' ? 'Pro Yearly' : 'Pro Monthly'} subscription is now fully active. All Pro features are unlocked.
          </Text>
          <Button
            title="Go to Subscription Overview"
            variant="primary"
            size="md"
            onPress={() => router.replace('/(teacher)/subscription')}
            style={styles.bannerBtn}
          />
        </Card>
      );
    }

    if (request.status === 'rejected') {
      return (
        <Card variant="elevated" padding="lg" style={[styles.statusBannerCard, styles.rejectedCard]}>
          <View style={[styles.iconCircle, styles.rejectedCircle]}>
            <Feather name="x" size={32} color={theme.colors.semantic.danger.main} />
          </View>
          <Text variant="heading" style={[styles.bannerTitle, styles.rejectedTitle]}>
            Verification Unsuccessful
          </Text>
          <Text variant="body" style={styles.bannerSubtitle}>
            {request.rejectionReason || 'The submitted transaction reference could not be matched with bank records.'}
          </Text>
          <Button
            title="Re-submit Payment Reference"
            variant="primary"
            size="md"
            onPress={() =>
              router.push({
                pathname: '/(teacher)/subscription/pay',
                params: { plan: request.plan },
              })
            }
            style={styles.bannerBtn}
          />
        </Card>
      );
    }

    // Pending state
    return (
      <Card variant="elevated" padding="lg" style={[styles.statusBannerCard, styles.pendingCard]}>
        <View style={[styles.iconCircle, styles.pendingCircle]}>
          <Feather name="clock" size={32} color="#D97706" />
        </View>
        <Text variant="heading" style={[styles.bannerTitle, styles.pendingTitle]}>
          Verification In Progress ⏳
        </Text>
        <Text variant="body" style={styles.bannerSubtitle}>
          We received your payment reference. Our verification team reconciles bank credits multiple times daily. Pro entitlements will activate immediately on verification.
        </Text>
        <Button
          title="Refresh Verification Status"
          variant="outline"
          size="md"
          loading={isRefreshing}
          onPress={handleRefresh}
          style={styles.bannerBtn}
        />
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Payment Request Status"
        subtitle="Track your manual UPI payment approval"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 36 },
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
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text variant="caption" style={styles.loadingText}>
              Checking payment records...
            </Text>
          </View>
        ) : (
          <>
            {renderStatusBanner()}

            {request && (
              <Card variant="outlined" padding="lg" style={styles.detailsCard}>
                <Text variant="heading" style={styles.detailsCardTitle}>
                  Transaction Details
                </Text>

                <View style={styles.detailRow}>
                  <Text variant="caption" style={styles.detailLabel}>
                    Status
                  </Text>
                  <Badge
                    label={
                      request.status === 'approved'
                        ? 'Approved'
                        : request.status === 'rejected'
                        ? 'Rejected'
                        : 'Under Review'
                    }
                    variant={
                      request.status === 'approved'
                        ? 'success'
                        : request.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  />
                </View>

                <View style={styles.detailRow}>
                  <Text variant="caption" style={styles.detailLabel}>
                    Plan
                  </Text>
                  <Text variant="body" style={styles.detailValue}>
                    {request.plan === 'yearly' ? 'Pro Yearly (365 days)' : 'Pro Monthly (30 days)'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="caption" style={styles.detailLabel}>
                    Amount Paid
                  </Text>
                  <Text variant="body" style={styles.detailValue}>
                    ₹{(request.amountPaise / 100).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="caption" style={styles.detailLabel}>
                    Payment Reference
                  </Text>
                  <Text variant="body" style={styles.detailValueMono}>
                    {request.paymentReference}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="caption" style={styles.detailLabel}>
                    Bank UTR / Transaction ID
                  </Text>
                  <Text variant="body" style={styles.detailValueMono}>
                    {request.transactionReference}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="caption" style={styles.detailLabel}>
                    Submitted At
                  </Text>
                  <Text variant="body" style={styles.detailValue}>
                    {new Date(request.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {request.reviewedAt && (
                  <View style={styles.detailRow}>
                    <Text variant="caption" style={styles.detailLabel}>
                      Reviewed At
                    </Text>
                    <Text variant="body" style={styles.detailValue}>
                      {new Date(request.reviewedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </Card>
            )}

            <View style={styles.footerNotice}>
              <Feather name="help-circle" size={16} color={theme.colors.text.tertiary} />
              <Text variant="caption" style={styles.footerNoticeText}>
                Need help with your payment? Contact support with your Payment Reference code.
              </Text>
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
  loadingBox: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  statusBannerCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 28,
    borderRadius: 16,
    marginBottom: 20,
    gap: 10,
  },
  approvedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  rejectedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  approvedCircle: {
    backgroundColor: '#DCFCE7',
  },
  rejectedCircle: {
    backgroundColor: '#FEE2E2',
  },
  pendingCircle: {
    backgroundColor: '#FEF3C7',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  approvedTitle: {
    color: '#166534',
  },
  rejectedTitle: {
    color: '#991B1B',
  },
  pendingTitle: {
    color: '#92400E',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  bannerBtn: {
    marginTop: 10,
    minWidth: 200,
  },
  detailsCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  detailValueMono: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  footerNoticeText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    flex: 1,
  },
});
