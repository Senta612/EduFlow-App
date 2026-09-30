import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Student, Batch } from '@/types/teacher';
import { theme } from '@/theme';

interface ShareInviteModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student | null;
  batch: Batch | null;
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
  visible,
  onClose,
  student,
  batch,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | 'message' | null>(null);

  if (!student) return null;

  const inviteCode =
    student.inviteCode ||
    `STU-${student.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'ACCESS'}`;
  
  const portalUrl = `https://eduflow.app/join?code=${inviteCode}`;

  const studentFirstName = student.name.split(' ')[0] || student.name;
  const batchName = batch?.name || 'Class Batch';
  const subjectName = batch?.subject || 'Studies';

  const shareMessage = `👋 Hello ${studentFirstName}!\n\nHere is your direct access link to the ${batchName} (${subjectName}) Student Portal on EduFlow:\n\n🔗 ${portalUrl}\n🔑 Access Code: ${inviteCode}\n\n✨ Track your attendance, homework tasks, and test results anytime without needing a password!`;

  const safeCopy = async (text: string, type: 'code' | 'link' | 'message') => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedType(type);
    } catch {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        // ignore
      }
      setCopiedType(type);
    }
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyCode = () => safeCopy(inviteCode, 'code');
  const handleCopyLink = () => safeCopy(portalUrl, 'link');
  const handleCopyMessage = () => safeCopy(shareMessage, 'message');

  const handleShareWhatsApp = async () => {
    const encoded = encodeURIComponent(shareMessage);
    const whatsappUrl = `whatsapp://send?text=${encoded}`;
    const webWhatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webWhatsappUrl);
      }
    } catch {
      try {
        await Linking.openURL(webWhatsappUrl);
      } catch {
        Alert.alert('Unable to open WhatsApp', 'You can copy the invite message and share it manually.');
      }
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: `EduFlow Student Portal - ${student.name}`,
        message: shareMessage,
      });
    } catch (err) {
      console.warn('Share sheet notice:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={styles.modalBackdropTouch}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close student portal access sheet"
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Feather name="send" size={18} color={theme.colors.primary.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="heading" style={styles.modalTitle}>
                  Student Portal Access
                </Text>
                <Text variant="caption" style={styles.modalSubtitle}>
                  Zero-login direct link for {student.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Student Preview Card */}
            <Card variant="outlined" padding="md" style={styles.studentBadgeCard}>
              <View style={styles.studentCardRow}>
                <View style={styles.avatarPill}>
                  <Text style={styles.avatarText}>
                    {student.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label" style={styles.studentNameText}>
                    {student.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={`Roll #${student.rollNumber}`} variant="primary" size="sm" />
                    {batch ? <Badge label={batch.name} variant="neutral" size="sm" /> : null}
                  </View>
                </View>
              </View>
            </Card>

            {/* Access Code Box */}
            <View style={styles.codeContainer}>
              <Text variant="caption" style={styles.fieldLabel}>
                STUDENT INVITE / ACCESS CODE
              </Text>
              <View style={styles.codeRow}>
                <View style={styles.codeDisplayBox}>
                  <Text style={styles.codeText}>{inviteCode}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyBtn, copiedType === 'code' && styles.copyBtnSuccess]}
                  onPress={handleCopyCode}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={copiedType === 'code' ? 'check' : 'copy'}
                    size={16}
                    color={copiedType === 'code' ? '#16A34A' : theme.colors.primary.main}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      copiedType === 'code' && { color: '#16A34A' },
                    ]}
                  >
                    {copiedType === 'code' ? 'Copied!' : 'Copy Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Direct Magic URL Box */}
            <View style={styles.codeContainer}>
              <Text variant="caption" style={styles.fieldLabel}>
                DIRECT MAGIC LINK (1-CLICK ACCESS)
              </Text>
              <View style={styles.linkRow}>
                <View style={styles.linkBox}>
                  <Feather name="link" size={14} color={theme.colors.text.tertiary} />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {portalUrl}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyIconBtn, copiedType === 'link' && styles.copyBtnSuccess]}
                  onPress={handleCopyLink}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={copiedType === 'link' ? 'check' : 'copy'}
                    size={16}
                    color={copiedType === 'link' ? '#16A34A' : theme.colors.primary.main}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Value Note / Callout */}
            <View style={styles.infoCallout}>
              <Feather name="zap" size={16} color="#D97706" />
              <Text variant="caption" style={styles.infoCalloutText}>
                Students open this link and immediately view their attendance, homework, and tests. <Text style={{ fontWeight: '700' }}>No password or account creation required!</Text>
              </Text>
            </View>

            {/* Primary Action: WhatsApp Share */}
            <TouchableOpacity
              style={styles.whatsAppButton}
              onPress={handleShareWhatsApp}
              activeOpacity={0.85}
            >
              <View style={styles.whatsAppIconCircle}>
                <Feather name="message-circle" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.whatsAppButtonText}>Share Link on WhatsApp</Text>
            </TouchableOpacity>

            {/* Secondary Actions Row */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleNativeShare}
                activeOpacity={0.7}
              >
                <Feather name="share-2" size={15} color={theme.colors.text.primary} />
                <Text style={styles.secondaryActionText}>Share via Apps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  copiedType === 'message' && styles.copyBtnSuccess,
                ]}
                onPress={handleCopyMessage}
                activeOpacity={0.7}
              >
                <Feather
                  name={copiedType === 'message' ? 'check' : 'clipboard'}
                  size={15}
                  color={copiedType === 'message' ? '#16A34A' : theme.colors.text.primary}
                />
                <Text
                  style={[
                    styles.secondaryActionText,
                    copiedType === 'message' && { color: '#16A34A' },
                  ]}
                >
                  {copiedType === 'message' ? 'Message Copied' : 'Copy Message'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Done Button */}
          <View style={styles.modalFooter}>
            <Button
              title="Done"
              variant="outline"
              fullWidth
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    maxHeight: '90%',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
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
  },
  scrollBody: {
    gap: 14,
    paddingVertical: 4,
  },
  studentBadgeCard: {
    backgroundColor: theme.colors.background.screen,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  studentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  codeContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  codeDisplayBox: {
    flex: 1,
    backgroundColor: theme.colors.primary.main + '10',
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main + '30',
    borderRadius: theme.radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary.main,
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary.main + '15',
    borderWidth: 1,
    borderColor: theme.colors.primary.main + '30',
  },
  copyBtnSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  linkBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  copyIconBtn: {
    width: 44,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    borderRadius: theme.radii.lg,
    paddingVertical: 14,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsAppIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    paddingVertical: 11,
    borderRadius: theme.radii.md,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalFooter: {
    paddingTop: 4,
  },
});
