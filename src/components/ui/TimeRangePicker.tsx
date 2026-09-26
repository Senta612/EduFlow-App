import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';

export interface TimeRangePickerProps {
  label?: string;
  value?: string; // e.g. "10:00 AM - 11:30 AM"
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

const DURATION_PRESETS = [
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '2h 30m', minutes: 150 },
];

const POPULAR_SLOTS = [
  { label: 'Morning', timing: '08:00 AM - 09:30 AM' },
  { label: 'Mid-Day', timing: '10:00 AM - 11:30 AM' },
  { label: 'Afternoon', timing: '03:00 PM - 04:30 PM' },
  { label: 'Evening', timing: '05:00 PM - 06:30 PM' },
  { label: 'Night', timing: '07:00 PM - 08:30 PM' },
];

/**
 * Parses time string like "10:00 AM" into a Date object on today's date
 */
function parseTimeString(timeStr?: string): Date {
  const d = new Date();
  if (!timeStr) {
    d.setHours(10, 0, 0, 0);
    return d;
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    d.setHours(10, 0, 0, 0);
    return d;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Formats a Date object into "hh:mm A" (e.g. "10:00 AM")
 */
function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hoursFormatted = hours.toString().padStart(2, '0');
  const minutesFormatted = minutes.toString().padStart(2, '0');

  return `${hoursFormatted}:${minutesFormatted} ${period}`;
}

/**
 * Calculates human-readable duration between two dates
 */
function getDurationText(startDate: Date, endDate: Date): { text: string; isNegative: boolean; minutes: number } {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes <= 0) {
    return { text: 'Invalid range', isNegative: true, minutes: diffMinutes };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hours === 0) {
    return { text: `${mins}m`, isNegative: false, minutes: diffMinutes };
  } else if (mins === 0) {
    return { text: `${hours}h`, isNegative: false, minutes: diffMinutes };
  } else {
    return { text: `${hours}h ${mins}m`, isNegative: false, minutes: diffMinutes };
  }
}

export function TimeRangePicker({
  label = 'Class Timing',
  value = '10:00 AM - 11:30 AM',
  onChange,
  error,
  helperText,
  disabled = false,
}: TimeRangePickerProps) {
  // Parse initial start and end times from value
  const { initialStart, initialEnd } = useMemo(() => {
    if (value && value.includes('-')) {
      const [startPart, endPart] = value.split('-').map((s) => s.trim());
      return {
        initialStart: parseTimeString(startPart),
        initialEnd: parseTimeString(endPart),
      };
    }
    const s = parseTimeString('10:00 AM');
    const e = parseTimeString('11:30 AM');
    return { initialStart: s, initialEnd: e };
  }, [value]);

  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(initialStart);

  const startFormatted = formatTime(initialStart);
  const endFormatted = formatTime(initialEnd);
  const duration = getDurationText(initialStart, initialEnd);

  // Handle open picker
  const handleOpenPicker = (type: 'start' | 'end') => {
    if (disabled) return;
    setActivePicker(type);
    setTempDate(type === 'start' ? initialStart : initialEnd);
  };

  // Handle picker change
  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
      if (event.type === 'set' && selectedDate) {
        applyNewTime(selectedDate);
      }
    } else {
      // iOS / Web
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  // Apply selected time
  const applyNewTime = (dateToApply: Date) => {
    if (activePicker === 'start') {
      const newStart = dateToApply;
      let newEnd = new Date(initialEnd);

      // If new start time is >= current end time, shift end time by previous valid duration (or 90 mins)
      if (newEnd.getTime() <= newStart.getTime()) {
        const defaultDurationMinutes = duration.isNegative || duration.minutes <= 0 ? 90 : duration.minutes;
        newEnd = new Date(newStart.getTime() + defaultDurationMinutes * 60 * 1000);
      }

      const formattedRange = `${formatTime(newStart)} - ${formatTime(newEnd)}`;
      onChange(formattedRange);
    } else if (activePicker === 'end') {
      const newEnd = dateToApply;
      const formattedRange = `${formatTime(initialStart)} - ${formatTime(newEnd)}`;
      onChange(formattedRange);
    }
    setActivePicker(null);
  };

  // Quick apply duration preset (e.g. +1h 30m to current start time)
  const handleApplyDuration = (minutes: number) => {
    if (disabled) return;
    const newEnd = new Date(initialStart.getTime() + minutes * 60 * 1000);
    onChange(`${formatTime(initialStart)} - ${formatTime(newEnd)}`);
  };

  // Quick apply popular preset slot
  const handleApplySlot = (timing: string) => {
    if (disabled) return;
    onChange(timing);
  };

  return (
    <View style={styles.container}>
      {/* Label and Duration Header */}
      <View style={styles.headerRow}>
        <View style={styles.labelContainer}>
          <Text variant="label" style={styles.label}>
            {label}
          </Text>
        </View>

        {!duration.isNegative && (
          <View style={styles.durationBadge}>
            <Feather name="clock" size={12} color={theme.colors.primary.main} />
            <Text variant="caption" style={styles.durationText}>
              {duration.text} duration
            </Text>
          </View>
        )}
      </View>

      {/* Main Dual Time Interactive Cards */}
      <View style={styles.cardsRow}>
        {/* Start Time Card */}
        <Pressable
          style={({ pressed }) => [
            styles.timeCard,
            activePicker === 'start' && styles.timeCardActive,
            pressed && styles.timeCardPressed,
            disabled && styles.disabledCard,
          ]}
          onPress={() => handleOpenPicker('start')}
          accessibilityRole="button"
          accessibilityLabel={`Start time: ${startFormatted}. Tap to change.`}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="sunrise" size={13} color={theme.colors.primary.main} />
            </View>
            <Text variant="caption" style={styles.cardLabel}>
              START TIME
            </Text>
          </View>
          <Text variant="heading" style={styles.timeValueText}>
            {startFormatted}
          </Text>
          <View style={styles.changeHint}>
            <Text variant="caption" style={styles.changeHintText}>
              Tap to edit
            </Text>
            <Feather name="chevron-down" size={12} color={theme.colors.text.tertiary} />
          </View>
        </Pressable>

        {/* Center Divider / Connector Arrow */}
        <View style={styles.arrowConnector}>
          <View style={styles.arrowLine} />
          <View style={styles.arrowIconContainer}>
            <Feather name="arrow-right" size={14} color={theme.colors.primary.main} />
          </View>
          <View style={styles.arrowLine} />
        </View>

        {/* End Time Card */}
        <Pressable
          style={({ pressed }) => [
            styles.timeCard,
            activePicker === 'end' && styles.timeCardActive,
            duration.isNegative && styles.timeCardError,
            pressed && styles.timeCardPressed,
            disabled && styles.disabledCard,
          ]}
          onPress={() => handleOpenPicker('end')}
          accessibilityRole="button"
          accessibilityLabel={`End time: ${endFormatted}. Tap to change.`}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconPill, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="sunset" size={13} color={theme.colors.semantic.warning.main} />
            </View>
            <Text variant="caption" style={styles.cardLabel}>
              END TIME
            </Text>
          </View>
          <Text
            variant="heading"
            style={[
              styles.timeValueText,
              duration.isNegative && { color: theme.colors.semantic.danger.main },
            ]}
          >
            {endFormatted}
          </Text>
          <View style={styles.changeHint}>
            <Text variant="caption" style={styles.changeHintText}>
              Tap to edit
            </Text>
            <Feather name="chevron-down" size={12} color={theme.colors.text.tertiary} />
          </View>
        </Pressable>
      </View>

      {/* Validation Warning if End Time <= Start Time */}
      {duration.isNegative && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={theme.colors.semantic.danger.main} />
          <Text variant="caption" style={styles.errorBannerText}>
            End time must be later than start time.
          </Text>
        </View>
      )}

      {/* Quick Duration Preset Pills */}
      <View style={styles.presetsSection}>
        <Text variant="caption" style={styles.sectionSubtitle}>
          Quick Duration:
        </Text>
        <View style={styles.durationPillsRow}>
          {DURATION_PRESETS.map((p) => {
            const isCurrentDuration = duration.minutes === p.minutes;
            return (
              <Pressable
                key={p.label}
                style={[
                  styles.durationPill,
                  isCurrentDuration && styles.durationPillActive,
                ]}
                onPress={() => handleApplyDuration(p.minutes)}
                accessibilityRole="button"
                accessibilityLabel={`Set duration to ${p.label}`}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.durationPillText,
                    isCurrentDuration && styles.durationPillTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Popular Time Slots Carousel */}
      <View style={styles.slotsSection}>
        <Text variant="caption" style={styles.sectionSubtitle}>
          Popular Slots:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotsRow}
        >
          {POPULAR_SLOTS.map((slot) => {
            const isSelected = value === slot.timing;
            return (
              <Pressable
                key={slot.timing}
                style={[
                  styles.slotChip,
                  isSelected && styles.slotChipSelected,
                ]}
                onPress={() => handleApplySlot(slot.timing)}
                accessibilityRole="button"
                accessibilityLabel={`Select slot ${slot.label}: ${slot.timing}`}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.slotChipLabel,
                    isSelected && styles.slotChipLabelSelected,
                  ]}
                >
                  {slot.label}
                </Text>
                <Text
                  variant="caption"
                  style={[
                    styles.slotChipTiming,
                    isSelected && styles.slotChipTimingSelected,
                  ]}
                >
                  {slot.timing}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Error Message */}
      {error && (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <Text variant="caption" style={styles.helperText}>
          {helperText}
        </Text>
      )}

      {/* Native Picker for Android (Dialog Mode) */}
      {Platform.OS === 'android' && activePicker && (
        <DateTimePicker
          value={activePicker === 'start' ? initialStart : initialEnd}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* iOS Modal Picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={activePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={styles.iosModalOverlay}>
            <Pressable
              style={styles.iosModalBackdrop}
              onPress={() => setActivePicker(null)}
            />
            <View style={styles.iosModalContent}>
              <View style={styles.iosModalHeader}>
                <Pressable
                  onPress={() => setActivePicker(null)}
                  style={styles.iosModalHeaderBtn}
                >
                  <Text variant="body" style={styles.iosCancelText}>
                    Cancel
                  </Text>
                </Pressable>
                <Text variant="label" style={styles.iosModalTitle}>
                  {activePicker === 'start' ? 'Select Start Time' : 'Select End Time'}
                </Text>
                <Pressable
                  onPress={() => applyNewTime(tempDate)}
                  style={styles.iosModalHeaderBtn}
                >
                  <Text variant="body" style={styles.iosDoneText}>
                    Done
                  </Text>
                </Pressable>
              </View>

              <View style={styles.iosPickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  textColor={theme.colors.text.primary}
                  onChange={handlePickerChange}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  durationText: {
    fontSize: 11,
    color: theme.colors.primary.dark,
    fontWeight: theme.typography.weights.semibold,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timeCard: {
    flex: 1,
    padding: theme.spacing.sm + 2,
    borderRadius: theme.radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.border.main,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  timeCardActive: {
    borderColor: theme.colors.primary.main,
    backgroundColor: '#F8FAFC',
  },
  timeCardError: {
    borderColor: theme.colors.semantic.danger.main,
    backgroundColor: '#FEF2F2',
  },
  timeCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  timeValueText: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginVertical: 2,
  },
  changeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  changeHintText: {
    fontSize: 11,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  arrowConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  arrowLine: {
    width: 1,
    height: 6,
    backgroundColor: theme.colors.border.main,
  },
  arrowIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginVertical: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: theme.colors.semantic.danger.main,
    fontWeight: theme.typography.weights.medium,
    fontSize: 12,
  },
  presetsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  durationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  durationPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  durationPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  durationPillText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  durationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
  },
  slotsSection: {
    gap: 6,
    marginTop: 2,
  },
  slotsRow: {
    gap: 8,
    paddingRight: theme.spacing.sm,
  },
  slotChip: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  slotChipSelected: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  slotChipLabel: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  slotChipLabelSelected: {
    color: theme.colors.primary.main,
  },
  slotChipTiming: {
    fontSize: 11,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  slotChipTimingSelected: {
    color: theme.colors.primary.dark,
    fontWeight: theme.typography.weights.bold,
  },
  errorText: {
    color: theme.colors.semantic.danger.main,
    marginTop: 2,
  },
  helperText: {
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  iosModalBackdrop: {
    flex: 1,
  },
  iosModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  iosModalHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iosModalTitle: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  iosCancelText: {
    color: theme.colors.text.secondary,
  },
  iosDoneText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  iosPickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
});
