import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/i18n';
import { SupportedLanguage } from '@/i18n/types';
import { theme } from '@/theme';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({
  visible,
  onClose,
}: LanguageSelectorModalProps) {
  const { language, setLanguage, availableLanguages, t } = useTranslation();

  const handleSelect = async (code: SupportedLanguage) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBox}>
                  <Feather name="globe" size={18} color={theme.colors.primary.main} />
                </View>
                <View>
                  <Text variant="label" style={styles.modalTitle}>
                    {t('settings.language')}
                  </Text>
                  <Text variant="caption" style={styles.modalSubtitle}>
                    {t('settings.selectLanguage')}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close Language Selector"
              >
                <Feather name="x" size={20} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            {/* Language Options List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {availableLanguages.map((option) => {
                const isSelected = language === option.code;

                return (
                  <Card
                    key={option.code}
                    variant={isSelected ? 'elevated' : 'outlined'}
                    padding="md"
                    style={[
                      styles.langCard,
                      isSelected && styles.langCardSelected,
                    ]}
                  >
                    <Pressable
                      style={styles.langPressable}
                      onPress={() => handleSelect(option.code)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={styles.langLeft}>
                        <Text style={styles.flagEmoji}>{option.flag}</Text>
                        <View style={styles.langMeta}>
                          <Text
                            variant="label"
                            style={[
                              styles.langNativeText,
                              isSelected && { color: theme.colors.primary.main },
                            ]}
                          >
                            {option.nativeLabel}
                          </Text>
                          <Text variant="caption" style={styles.langSubText}>
                            {option.label}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.radioIndicator,
                          isSelected && styles.radioIndicatorSelected,
                        ]}
                      >
                        {isSelected && (
                          <Feather name="check" size={13} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  </Card>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background.paper,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '80%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  langCard: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background.paper,
    borderColor: theme.colors.border.main,
  },
  langCardSelected: {
    borderColor: theme.colors.primary.main,
    borderWidth: 1.5,
    backgroundColor: theme.colors.primary.bg,
  },
  langPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagEmoji: {
    fontSize: 24,
  },
  langMeta: {
    gap: 1,
  },
  langNativeText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  langSubText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.screen,
  },
  radioIndicatorSelected: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
});
