import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EditTeacherProfileModal } from '@/components/profile';
import { useAuth } from '@/hooks/useAuth';
import { teacherService } from '@/services/teacher.service';
import { theme } from '@/theme';

export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut, updateProfile } = useAuth();

  const [batchesCount, setBatchesCount] = useState(3);
  const [studentsCount, setStudentsCount] = useState(0);
  const [testsCount, setTestsCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    async function loadTeacherStats() {
      try {
        const [batches, tests] = await Promise.all([
          teacherService.getBatches(),
          teacherService.getTestsList(),
        ]);
        setBatchesCount(batches.length);
        setTestsCount(tests.length);

        let totalSt = 0;
        for (const b of batches) {
          const stList = await teacherService.getBatchStudents(b.id);
          totalSt += stList.length;
        }
        setStudentsCount(totalSt);
      } catch (error) {
        console.warn('Failed to load teaching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }
    loadTeacherStats();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = (phone?: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {
        Alert.alert('WhatsApp Failed', 'Unable to open WhatsApp on this device.');
      });
    });
  };

  const teacherName = profile?.full_name || user?.email?.split('@')[0] || 'Teacher';
  const instituteName = profile?.institute_name || 'My Tuition Academy';
  const specialization = profile?.specialization || '';
  const qualifications = profile?.qualifications || '';
  const bio = profile?.bio || '';
  const phone = profile?.phone || '';
  const email = user?.email || '';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Teacher & Institute Profile"
        subtitle="Manage faculty credentials & tuition center branding"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* 1. Hero Identity Card */}
        <Card variant="elevated" padding="lg" style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>
                {teacherName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineBadge}>
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text variant="heading" style={styles.heroName}>
              {teacherName}
            </Text>
            <Text variant="caption" style={styles.heroSpecialization}>
              {specialization}
            </Text>
            <View style={styles.institutePill}>
              <Feather name="home" size={12} color={theme.colors.primary.main} />
              <Text variant="caption" style={styles.institutePillText}>
                {instituteName}
              </Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Button
            title="Edit Profile & Info"
            variant="outline"
            size="sm"
            icon="edit-2"
            onPress={() => setIsEditModalVisible(true)}
            style={styles.editBtn}
          />
        </Card>

        {/* 2. Teaching Quick Stats Bar */}
        <View style={styles.statsBar}>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.primary.bg }]}>
              <Feather name="layers" size={16} color={theme.colors.primary.main} />
            </View>
            <Text variant="title" style={styles.statValue}>
              {isLoadingStats ? '...' : batchesCount}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              Active Batches
            </Text>
          </Card>

          <Card variant="elevated" padding="md" style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.semantic.success.bg }]}>
              <Feather name="users" size={16} color={theme.colors.semantic.success.main} />
            </View>
            <Text variant="title" style={styles.statValue}>
              {isLoadingStats ? '...' : studentsCount}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              Total Students
            </Text>
          </Card>

          <Card variant="elevated" padding="md" style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.semantic.info.bg }]}>
              <Feather name="award" size={16} color={theme.colors.semantic.info.main} />
            </View>
            <Text variant="title" style={styles.statValue}>
              {isLoadingStats ? '...' : testsCount}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              Tests Created
            </Text>
          </Card>
        </View>

        {/* 3. Institute & Contact Information Card */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>
            Institute & Contact Details
          </Text>
          <Card variant="elevated" padding="none" style={styles.detailsCard}>
            {/* Institute Name */}
            <View style={[styles.detailRow, styles.rowBorder]}>
              <View style={styles.detailIconBox}>
                <Feather name="home" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.detailMeta}>
                <Text variant="caption" style={styles.detailLabel}>
                  Tuition / Institute Name
                </Text>
                <Text variant="body" style={styles.detailValue}>
                  {instituteName}
                </Text>
              </View>
            </View>

            {/* Phone & WhatsApp */}
            <View style={[styles.detailRow, styles.rowBorder]}>
              <View style={styles.detailIconBox}>
                <Feather name="phone" size={16} color={theme.colors.semantic.success.main} />
              </View>
              <View style={styles.detailMeta}>
                <Text variant="caption" style={styles.detailLabel}>
                  Phone / WhatsApp Contact
                </Text>
                <Text variant="body" style={styles.detailValue}>
                  {phone}
                </Text>
              </View>
              <View style={styles.quickContactActions}>
                <Pressable
                  style={styles.contactIconBtn}
                  onPress={() => handleCall(phone)}
                  accessibilityRole="button"
                  accessibilityLabel="Call teacher phone"
                >
                  <Feather name="phone" size={14} color={theme.colors.text.primary} />
                </Pressable>
                <Pressable
                  style={[styles.contactIconBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={() => handleWhatsApp(phone)}
                  accessibilityRole="button"
                  accessibilityLabel="WhatsApp teacher"
                >
                  <FontAwesome name="whatsapp" size={16} color="#16A34A" />
                </Pressable>
              </View>
            </View>

            {/* Email Address */}
            <View style={[styles.detailRow, styles.rowBorder]}>
              <View style={styles.detailIconBox}>
                <Feather name="mail" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.detailMeta}>
                <Text variant="caption" style={styles.detailLabel}>
                  Email Address
                </Text>
                <Text variant="body" style={styles.detailValue}>
                  {email}
                </Text>
              </View>
            </View>

            {/* Assigned Role */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="shield" size={16} color={theme.colors.primary.main} />
              </View>
              <View style={styles.detailMeta}>
                <Text variant="caption" style={styles.detailLabel}>
                  Platform Role
                </Text>
                <Text variant="body" style={styles.detailValue}>
                  Faculty / Lead Instructor
                </Text>
              </View>
              <Badge label="Active" variant="success" size="sm" />
            </View>
          </Card>
        </View>

        {/* 4. Qualifications & Teaching Bio Card */}
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionTitle}>
            Credentials & Bio
          </Text>
          <Card variant="elevated" padding="md" style={styles.bioCard}>
            <View style={styles.bioHeader}>
              <Feather name="award" size={16} color={theme.colors.primary.main} />
              <Text variant="label" style={styles.bioHeading}>
                {qualifications}
              </Text>
            </View>
            <Text variant="caption" style={styles.bioDescription}>
              {bio}
            </Text>
          </Card>
        </View>

        {/* 5. Account Actions */}
        <View style={styles.accountActionsSection}>
          <Button
            title="Sign Out of Account"
            variant="danger"
            icon="log-out"
            fullWidth
            onPress={handleSignOut}
          />
          <Text variant="caption" style={styles.versionText}>
            EduFlow Teacher App • Version 1.0.0 (Production)
          </Text>
        </View>
      </ScrollView>

      {/* Edit Teacher Profile Modal */}
      <EditTeacherProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        profile={profile}
        onSave={async (updates) => {
          await updateProfile(updates);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.background.paper,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    alignItems: 'center',
    gap: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  heroSpecialization: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  institutePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary.bg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    marginTop: 6,
  },
  institutePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  editBtn: {
    marginTop: 4,
    minWidth: 160,
  },
  statsBar: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMeta: {
    flex: 1,
    gap: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  quickContactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioCard: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  bioHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  bioDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  accountActionsSection: {
    gap: theme.spacing.sm,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  versionText: {
    fontSize: 11,
    color: theme.colors.text.disabled,
  },
});
