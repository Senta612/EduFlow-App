import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/payment.service';
import { PaymentRequest } from '@/types/subscription';
import { theme } from '@/theme';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminPaymentReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';

  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [targetRejectRequest, setTargetRejectRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await paymentService.getAllPaymentRequestsForAdmin();
      setRequests(data);
    } catch (e) {
      console.warn('Failed to load admin payment requests:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRequests();
    setIsRefreshing(false);
  }, [loadRequests]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCopy = async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = (req: PaymentRequest) => {
    Alert.alert(
      'Confirm Payment Approval',
      `Approve payment of ₹${(req.amountPaise / 100).toLocaleString('en-IN')} for ${req.teacherName || 'Teacher'} (${req.plan === 'yearly' ? 'Yearly' : 'Monthly'})?\n\nUTR: ${req.transactionReference}\n\nThis will instantly activate their Pro subscription.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Activate',
          style: 'default',
          onPress: async () => {
            setProcessingId(req.id);
            try {
              await paymentService.reviewPaymentRequest(req.id, 'approve');
              Alert.alert('Approved! ✅', 'The payment was approved and the teacher subscription has been activated.');
              await loadRequests();
            } catch (err: any) {
              Alert.alert('Approval Failed', err.message || 'Failed to approve payment.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const openRejectModal = (req: PaymentRequest) => {
    setTargetRejectRequest(req);
    setRejectionReason('Transaction reference could not be matched with bank record.');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!targetRejectRequest) return;
    const cleanReason = rejectionReason.trim() || 'Payment verification failed.';

    setProcessingId(targetRejectRequest.id);
    setRejectModalVisible(false);

    try {
      await paymentService.reviewPaymentRequest(targetRejectRequest.id, 'reject', cleanReason);
      Alert.alert('Request Rejected', 'The payment request has been marked as rejected.');
      await loadRequests();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Failed to reject payment request.');
    } finally {
      setProcessingId(null);
      setTargetRejectRequest(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  // Access Control Guard
  if (!isAdmin && !isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Payment Review"
          subtitle="Admin verification panel"
          showBack
          onBack={() => router.back()}
        />
        <View style={styles.deniedBox}>
          <Feather name="shield-off" size={48} color={theme.colors.semantic.danger.main} />
          <Text variant="heading" style={styles.deniedTitle}>
            Administrator Access Required
          </Text>
          <Text variant="body" style={styles.deniedText}>
            This portal is restricted to authorized EduFlow administrators to review and approve bank UPI payments.
          </Text>
          <Button
            title="Return to Dashboard"
            variant="outline"
            size="md"
            onPress={() => router.replace('/(teacher)')}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Admin Payment Review"
        subtitle={`${pendingCount} pending payment verification${pendingCount === 1 ? '' : 's'}`}
        showBack
        onBack={() => router.back()}
      />

      {/* Filter Tabs Bar */}
      <View style={styles.tabsBar}>
        {(['pending', 'approved', 'rejected', 'all'] as FilterTab[]).map((tab) => {
          const count =
            tab === 'all'
              ? requests.length
              : requests.filter((r) => r.status === tab).length;
          const isActive = filter === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    isActive && styles.tabBadgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
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
              Loading payment requests...
            </Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <Card variant="outlined" padding="lg" style={styles.emptyCard}>
            <Feather name="inbox" size={36} color={theme.colors.text.tertiary} />
            <Text variant="heading" style={styles.emptyTitle}>
              No {filter} requests
            </Text>
            <Text variant="caption" style={styles.emptySubtitle}>
              {filter === 'pending'
                ? 'All pending payments have been reviewed! New submissions will appear here.'
                : `There are currently no ${filter} payment requests in the system.`}
            </Text>
          </Card>
        ) : (
          <View style={styles.requestsList}>
            {filteredRequests.map((req) => {
              const isProcessing = processingId === req.id;

              return (
                <Card
                  key={req.id}
                  variant="elevated"
                  padding="md"
                  style={styles.requestCard}
                >
                  {/* Teacher & Amount Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.teacherInfo}>
                      <Text variant="heading" style={styles.teacherName}>
                        {req.teacherName || 'Teacher'}
                      </Text>
                      {req.teacherEmail && (
                        <Text variant="caption" style={styles.teacherEmail}>
                          {req.teacherEmail}
                        </Text>
                      )}
                    </View>

                    <View style={styles.amountPill}>
                      <Text style={styles.amountPillText}>
                        ₹{(req.amountPaise / 100).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Plan & Reference Info */}
                  <View style={styles.metaRow}>
                    <Badge
                      label={req.plan === 'yearly' ? 'Pro Yearly (365d)' : 'Pro Monthly (30d)'}
                      variant={req.plan === 'yearly' ? 'purple' : 'primary'}
                      size="sm"
                    />

                    <Badge
                      label={
                        req.status === 'approved'
                          ? 'Approved'
                          : req.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending Review'
                      }
                      variant={
                        req.status === 'approved'
                          ? 'success'
                          : req.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    />
                  </View>

                  {/* UTR & Copy Box */}
                  <View style={styles.utrBox}>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={styles.utrLabel}>
                        SUBMITTED BANK UTR / REF
                      </Text>
                      <Text style={styles.utrText}>{req.transactionReference}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleCopy(req.transactionReference, req.id)}
                      style={styles.utrCopyBtn}
                    >
                      <Feather
                        name={copiedId === req.id ? 'check' : 'copy'}
                        size={14}
                        color={copiedId === req.id ? '#16A34A' : theme.colors.primary.main}
                      />
                      <Text style={styles.utrCopyText}>
                        {copiedId === req.id ? 'Copied' : 'Copy'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Request ID & Timestamp */}
                  <View style={styles.footRow}>
                    <Text variant="caption" style={styles.footText}>
                      Ref: {req.paymentReference}
                    </Text>
                    <Text variant="caption" style={styles.footText}>
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* Rejection notice if present */}
                  {req.status === 'rejected' && req.rejectionReason && (
                    <View style={styles.rejectionBanner}>
                      <Feather name="alert-circle" size={13} color={theme.colors.semantic.danger.main} />
                      <Text variant="caption" style={styles.rejectionBannerText}>
                        Rejected: {req.rejectionReason}
                      </Text>
                    </View>
                  )}

                  {/* Actions for Pending Requests */}
                  {req.status === 'pending' && (
                    <View style={styles.actionButtonsRow}>
                      <Button
                        title="Approve Payment"
                        variant="primary"
                        size="sm"
                        loading={isProcessing}
                        onPress={() => handleApprove(req)}
                        style={styles.approveBtn}
                      />

                      <Button
                        title="Reject"
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onPress={() => openRejectModal(req)}
                        style={styles.rejectBtn}
                      />
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Feather name="alert-triangle" size={20} color={theme.colors.semantic.danger.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="heading" style={styles.modalTitle}>
                  Reject Payment Request
                </Text>
                <Text variant="caption" style={styles.modalSub}>
                  UTR: {targetRejectRequest?.transactionReference}
                </Text>
              </View>
            </View>

            <Text variant="body" style={styles.modalBody}>
              Please provide a clear reason. The teacher will be informed so they can verify their bank account and resubmit.
            </Text>

            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g. UTR not found in bank statement, amount mismatch..."
              placeholderTextColor={theme.colors.text.tertiary}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setRejectModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Rejection"
                variant="primary"
                size="md"
                onPress={handleConfirmReject}
                style={[styles.confirmRejectBtn, { flex: 1 }]}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.background.screen,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tabLabelActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary.main,
  },
  tabBadgeInactive: {
    backgroundColor: theme.colors.border.main,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.secondary,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
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
  deniedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  deniedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.semantic.danger.main,
    textAlign: 'center',
  },
  deniedText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    maxWidth: 280,
    lineHeight: 18,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  teacherEmail: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  amountPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.screen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  utrLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  utrText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  utrCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.primary.bg,
    borderRadius: 6,
  },
  utrCopyText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectionBannerText: {
    color: theme.colors.semantic.danger.main,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border.light,
    paddingTop: 10,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
  },
  rejectBtn: {
    flex: 1,
    borderColor: theme.colors.semantic.danger.main,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  modalBody: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  confirmRejectBtn: {
    backgroundColor: theme.colors.semantic.danger.main,
  },
});
