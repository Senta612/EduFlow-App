import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TeacherPaymentConfig } from '@/types/fee';
import { theme } from '@/theme';

interface TeacherPaymentConfigModalProps {
  visible: boolean;
  onClose: () => void;
  initialConfig?: TeacherPaymentConfig | null;
  onSave: (config: TeacherPaymentConfig) => Promise<void>;
}

export const TeacherPaymentConfigModal: React.FC<TeacherPaymentConfigModalProps> = ({
  visible,
  onClose,
  initialConfig,
  onSave,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);
  const [instructions, setInstructions] = useState('');
  const [acceptOnlinePayment, setAcceptOnlinePayment] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');

  useEffect(() => {
    if (visible) {
      setIsEnabled(Boolean(initialConfig?.isEnabled));
      setUpiId(initialConfig?.upiId || '');
      setPayeeName(initialConfig?.payeeName || '');
      setPhoneNumber(initialConfig?.phoneNumber || '');
      setQrCodeUrl(initialConfig?.qrCodeUrl);
      setInstructions(
        initialConfig?.instructions ||
          'Please send payment confirmation screenshot on WhatsApp.',
      );
      setAcceptOnlinePayment(
        initialConfig?.acceptOnlinePayment !== undefined
          ? initialConfig.acceptOnlinePayment
          : true,
      );
      setActiveTab('details');
    }
  }, [visible, initialConfig]);

  const handlePickQrImage = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setQrCodeUrl(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Failed to pick QR code image:', e);
      Alert.alert('Selection Error', 'Could not access image. Please try again.');
    }
  };

  const handleRemoveQrImage = () => {
    setQrCodeUrl(undefined);
  };

  const handleSave = async () => {
    const cleanUpi = upiId.trim();
    if (isEnabled && cleanUpi && !cleanUpi.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI address (e.g. yourname@bank).');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        isEnabled,
        upiId: cleanUpi || undefined,
        payeeName: payeeName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        qrCodeUrl: qrCodeUrl || undefined,
        instructions: instructions.trim() || undefined,
        acceptOnlinePayment,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save payment configuration:', err);
      Alert.alert('Error', 'Failed to save payment settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview generated QR URL
  const previewUpiUrl = `upi://pay?pa=${encodeURIComponent(
    upiId.trim() || 'teacher@upi',
  )}&pn=${encodeURIComponent(
    payeeName.trim() || 'Tuition Classes',
  )}&am=1500&cu=INR&tn=Tuition%20Fee`;

  const dynamicQrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    previewUpiUrl,
  )}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdropTouch} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.modalHeaderIconWrap}>
                <Feather name="credit-card" size={20} color={theme.colors.primary.main} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Fee Portal & UPI Collection</Text>
                <Text style={styles.modalSubtitle}>Configure direct student payments & QR</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabItem, activeTab === 'details' && styles.tabItemActive]}
              onPress={() => setActiveTab('details')}
            >
              <Feather
                name="sliders"
                size={14}
                color={activeTab === 'details' ? theme.colors.primary.main : theme.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'details' && styles.tabTextActive,
                ]}
              >
                Configuration
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabItem, activeTab === 'preview' && styles.tabItemActive]}
              onPress={() => setActiveTab('preview')}
            >
              <Feather
                name="eye"
                size={14}
                color={activeTab === 'preview' ? theme.colors.primary.main : theme.colors.text.tertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'preview' && styles.tabTextActive,
                ]}
              >
                Student Preview
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'details' ? (
              <>
                {/* 1. Master Activation Switch */}
                <Card
                  variant="outlined"
                  padding="md"
                  style={[
                    styles.enableCard,
                    isEnabled ? styles.enableCardActive : styles.enableCardInactive,
                  ]}
                >
                  <View style={styles.enableCardRow}>
                    <View style={styles.enableCardTexts}>
                      <View style={styles.badgeRow}>
                        <Text style={styles.enableCardTitle}>Allow Student Fee Portal</Text>
                        <Badge
                          label={isEnabled ? 'ACTIVE' : 'OFF'}
                          variant={isEnabled ? 'success' : 'neutral'}
                          size="sm"
                        />
                      </View>
                      <Text style={styles.enableCardDesc}>
                        When enabled, students see their monthly fee dues, pay via UPI / QR code,
                        and download digital PDF receipts.
                      </Text>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={setIsEnabled}
                      trackColor={{ false: '#CBD5E1', true: theme.colors.primary.main }}
                    />
                  </View>
                </Card>

                {/* 2. UPI & Payee Credentials */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>Payment Destination</Text>

                  <Input
                    label="UPI ID / VPA (Google Pay, PhonePe, Paytm)"
                    placeholder="e.g. teacher@oksbi or 9876543210@paytm"
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    leftContent={<Feather name="at-sign" size={16} color={theme.colors.text.tertiary} />}
                    helperText="Direct payments will be credited directly to this bank account."
                  />

                  <Input
                    label="Payee / Institute Name"
                    placeholder="e.g. Sharma Coaching Academy"
                    value={payeeName}
                    onChangeText={setPayeeName}
                    leftContent={<Feather name="home" size={16} color={theme.colors.text.tertiary} />}
                    helperText="Displayed as receiver name inside student UPI apps."
                  />

                  <Input
                    label="Contact & WhatsApp Number"
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    leftContent={<Feather name="phone" size={16} color={theme.colors.text.tertiary} />}
                    helperText="For payment verification screenshots and parent queries."
                  />
                </View>

                {/* 3. QR Code Upload / Auto-Generation */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>UPI Payment QR Code</Text>
                  <Text style={styles.sectionSub}>
                    Upload your Google Pay, PhonePe, or Paytm QR code screenshot, or let EduFlow
                    generate one automatically from your UPI ID.
                  </Text>

                  {qrCodeUrl ? (
                    <View style={styles.uploadedQrBox}>
                      <Image source={{ uri: qrCodeUrl }} style={styles.qrPreviewImage} resizeMode="contain" />
                      <View style={styles.qrMetaInfo}>
                        <View style={styles.qrBadgeRow}>
                          <Badge label="Custom QR Uploaded" variant="success" size="sm" />
                        </View>
                        <Text style={styles.qrMetaNote}>
                          This screenshot will be presented directly to students when paying.
                        </Text>
                        <View style={styles.qrActionButtons}>
                          <Pressable style={styles.qrReplaceBtn} onPress={handlePickQrImage}>
                            <Feather name="refresh-cw" size={13} color={theme.colors.primary.main} />
                            <Text style={styles.qrReplaceText}>Change</Text>
                          </Pressable>
                          <Pressable style={styles.qrRemoveBtn} onPress={handleRemoveQrImage}>
                            <Feather name="trash-2" size={13} color={theme.colors.semantic.danger.main} />
                            <Text style={styles.qrRemoveText}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.uploadQrDashedBox, pressed && { opacity: 0.8 }]}
                      onPress={handlePickQrImage}
                    >
                      <View style={styles.uploadQrIconCircle}>
                        <Feather name="image" size={24} color={theme.colors.primary.main} />
                      </View>
                      <Text style={styles.uploadQrTitle}>Upload Custom QR Code Screenshot</Text>
                      <Text style={styles.uploadQrSubtitle}>
                        PNG, JPG from gallery • Auto-generates if left blank
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* 4. Payment Instructions */}
                <View style={styles.sectionBlock}>
                  <Input
                    label="Instructions for Students & Parents"
                    placeholder="e.g. Please send payment confirmation screenshot on WhatsApp."
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline
                    numberOfLines={2}
                    leftContent={<Feather name="info" size={16} color={theme.colors.text.tertiary} />}
                  />
                </View>
              </>
            ) : (
              /* Student Preview Tab */
              <View style={styles.previewContainer}>
                <View style={styles.previewNoticeRow}>
                  <Feather name="info" size={16} color={theme.colors.primary.main} />
                  <Text style={styles.previewNoticeText}>
                    This is how the payment card and QR code will appear in the student portal:
                  </Text>
                </View>

                <Card variant="elevated" padding="lg" style={styles.previewCard}>
                  <View style={styles.previewCardHeader}>
                    <View>
                      <Text style={styles.previewInstituteTitle}>
                        {payeeName || 'Tuition Academy'}
                      </Text>
                      <Text style={styles.previewFeeMonth}>October 2026 Tuition Fee</Text>
                    </View>
                    <Badge label="DUE" variant="warning" size="md" />
                  </View>

                  <View style={styles.previewAmountRow}>
                    <Text style={styles.previewAmountLabel}>Total Due</Text>
                    <Text style={styles.previewAmountValue}>₹1,500</Text>
                  </View>

                  {/* QR Box in Preview */}
                  <View style={styles.previewQrWrapper}>
                    <Image
                      source={{ uri: qrCodeUrl || dynamicQrPreviewUrl }}
                      style={styles.previewQrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.previewScanText}>
                      Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)
                    </Text>
                  </View>

                  {/* Credentials Row */}
                  <View style={styles.previewDetailsBox}>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>UPI ID:</Text>
                      <Text style={styles.previewDetailValue}>{upiId || 'Not provided'}</Text>
                    </View>
                    {phoneNumber ? (
                      <View style={styles.previewDetailItem}>
                        <Text style={styles.previewDetailLabel}>Phone / GPay:</Text>
                        <Text style={styles.previewDetailValue}>{phoneNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Mock Action Buttons */}
                  <View style={styles.previewButtonsColumn}>
                    <View style={styles.mockPayBtn}>
                      <Feather name="send" size={15} color="#FFFFFF" />
                      <Text style={styles.mockPayBtnText}>Pay via UPI App</Text>
                    </View>
                    <View style={styles.mockWhatsappBtn}>
                      <Feather name="message-circle" size={15} color="#166534" />
                      <Text style={styles.mockWhatsappBtnText}>Share Screenshot on WhatsApp</Text>
                    </View>
                  </View>
                </Card>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={isSaving}
              style={{ flex: 1 }}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Save Configuration'}
              variant="primary"
              icon="check"
              onPress={handleSave}
              disabled={isSaving}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary.bg,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  enableCard: {
    borderWidth: 1.5,
  },
  enableCardActive: {
    borderColor: theme.colors.semantic.success.main,
    backgroundColor: '#F0FDF4',
  },
  enableCardInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  enableCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  enableCardTexts: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enableCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  enableCardDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  sectionSub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  uploadQrDashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.main,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadQrIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadQrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  uploadQrSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  uploadedQrBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  qrPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrMetaInfo: {
    flex: 1,
    gap: 4,
  },
  qrBadgeRow: {
    flexDirection: 'row',
  },
  qrMetaNote: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 15,
  },
  qrActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  qrReplaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrReplaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  qrRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrRemoveText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.semantic.danger.main,
  },
  previewContainer: {
    gap: 14,
  },
  previewNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary.bg,
    padding: 12,
    borderRadius: 10,
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.primary.main,
    lineHeight: 16,
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewInstituteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  previewFeeMonth: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  previewAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  previewAmountLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  previewAmountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  previewQrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  previewQrImage: {
    width: 170,
    height: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  previewScanText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  previewDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  previewDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewDetailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  previewDetailValue: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  previewButtonsColumn: {
    gap: 8,
  },
  mockPayBtn: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mockPayBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  mockWhatsappBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mockWhatsappBtnText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
