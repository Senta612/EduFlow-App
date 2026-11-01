import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StudentFeePortalView } from '@/types/student';
import { FeeStatus } from '@/types/teacher';
import { theme } from '@/theme';

interface StudentFeeCardProps {
  feeData: StudentFeePortalView;
  onPress: () => void;
}

export const StudentFeeCard: React.FC<StudentFeeCardProps> = ({ feeData, onPress }) => {
  const { feeStatus, dueAmount, monthlyFee, dueDateFormatted, forMonth, lastPayment } = feeData;

  const getStatusBadgeVariant = (status: FeeStatus) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'free':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: FeeStatus) => {
    switch (status) {
      case 'paid':
        return 'Paid & Clear';
      case 'overdue':
        return 'Overdue';
      case 'pending':
        return `Due ₹${dueAmount}`;
      case 'free':
        return 'Scholarship / Free';
      default:
        return 'Pending';
    }
  };

  const isPaid = feeStatus === 'paid';
  const isFree = feeStatus === 'free';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isPaid
                  ? '#DCFCE7'
                  : feeStatus === 'overdue'
                  ? '#FEE2E2'
                  : '#FEF3C7',
              },
            ]}
          >
            <Feather
              name={isPaid ? 'check-circle' : 'credit-card'}
              size={18}
              color={
                isPaid
                  ? '#16A34A'
                  : feeStatus === 'overdue'
                  ? theme.colors.semantic.danger.main
                  : '#D97706'
              }
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>Tuition Fees & Receipts</Text>
            <Text style={styles.cardPeriod}>{forMonth}</Text>
          </View>
        </View>

        <Badge
          label={getStatusLabel(feeStatus)}
          variant={getStatusBadgeVariant(feeStatus) as any}
          size="sm"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.contentRow}>
        <View style={styles.amountCol}>
          <Text style={styles.amountCaption}>
            {isPaid ? 'Status' : isFree ? 'Tuition Grant' : 'Due Amount'}
          </Text>
          <Text
            style={[
              styles.amountValue,
              {
                color: isPaid
                  ? '#16A34A'
                  : feeStatus === 'overdue'
                  ? theme.colors.semantic.danger.main
                  : theme.colors.text.primary,
              },
            ]}
          >
            {isPaid
              ? 'All Dues Paid'
              : isFree
              ? '100% Scholarship'
              : `₹${dueAmount.toLocaleString()}`}
          </Text>
        </View>

        <View style={styles.metaCol}>
          <Text style={styles.metaCaption}>
            {isPaid ? 'Last Recorded Receipt' : 'Due Date'}
          </Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {isPaid
              ? lastPayment
                ? `#${lastPayment.receiptNumber}`
                : 'Verified'
              : dueDateFormatted}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <Feather
            name={isPaid ? 'file-text' : 'zap'}
            size={13}
            color={theme.colors.primary.main}
          />
          <Text style={styles.footerHint}>
            {isPaid
              ? 'Download verified PDF receipts'
              : 'Pay via UPI, GPay, PhonePe or QR code'}
          </Text>
        </View>

        <View style={styles.actionPill}>
          <Text style={styles.actionPillText}>{isPaid ? 'View Receipts' : 'Pay Now'}</Text>
          <Feather name="chevron-right" size={13} color={theme.colors.primary.main} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cardPeriod: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amountCol: {
    gap: 2,
  },
  amountCaption: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metaCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metaCaption: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerHint: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
});
