import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_OPTIONS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
  '06:30 PM',
  '08:00 PM',
];

export function parseDateString(val?: string | null): Date {
  if (!val) return new Date();
  
  // Try direct Date parse
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle format like "19 Sep 2026" or "19 Sep 2026, 05:00 PM"
  const dateMatch = val.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const monthStr = dateMatch[2].substring(0, 3).toLowerCase();
    const year = parseInt(dateMatch[3], 10);
    const monthIndex = MONTH_SHORT.findIndex(
      (m) => m.toLowerCase() === monthStr
    );

    if (monthIndex !== -1) {
      const d = new Date(year, monthIndex, day);
      return d;
    }
  }

  // Handle relative strings like "Today" or "Tomorrow"
  if (val.toLowerCase().includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  return new Date();
}

export function getFormattedDate(offsetDays: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDate(date: Date, mode: 'date' | 'datetime' = 'date', timeStr?: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_SHORT[date.getMonth()];
  const year = date.getFullYear();

  if (mode === 'datetime' && timeStr) {
    return `${day} ${month} ${year}, ${timeStr}`;
  }
  return `${day} ${month} ${year}`;
}

export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (formattedDate: string, rawDate: Date) => void;
  value?: string;
  title?: string;
  mode?: 'date' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerModal({
  visible,
  onClose,
  onSelect,
  value,
  title = 'Select Date',
  mode = 'date',
  minDate,
  maxDate,
}: DatePickerModalProps) {
  const initialDate = useMemo(() => parseDateString(value), [value, visible]);

  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>('05:00 PM');

  // Sync state whenever modal is opened
  React.useEffect(() => {
    if (visible) {
      const d = parseDateString(value);
      setSelectedDate(d);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());

      if (value && value.includes(':')) {
        const timeMatch = value.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
        if (timeMatch) {
          setSelectedTime(timeMatch[1].toUpperCase());
        }
      }
    }
  }, [visible, value]);

  const today = useMemo(() => new Date(), []);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayWeekday = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const selectPreset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  const handleApply = () => {
    const formatted = formatDate(selectedDate, mode, selectedTime);
    onSelect(formatted, selectedDate);
    onClose();
  };

  const calendarDays = useMemo(() => {
    const items: Array<{
      day: number;
      isCurrentMonth: boolean;
      date: Date;
    }> = [];

    // Prev month padding days
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      items.push({ day, isCurrentMonth: false, date });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      items.push({ day, isCurrentMonth: true, date });
    }

    // Next month padding to fill complete weeks
    const remaining = (7 - (items.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      items.push({ day: i, isCurrentMonth: false, date });
    }

    return items;
  }, [currentYear, currentMonth, daysInMonth, firstDayWeekday]);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Animated.View
            entering={ZoomIn.springify().damping(16).stiffness(150)}
            exiting={ZoomOut.duration(160)}
            style={styles.cardContainer}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardInner}>
              {/* Modal Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleWrap}>
                  <Feather name="calendar" size={18} color={theme.colors.primary.main} />
                  <Text variant="heading" style={styles.headerTitle}>
                    {title}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close date picker"
                >
                  <Feather name="x" size={18} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetsRow}>
                {[
                  { label: 'Today', offset: 0 },
                  { label: 'Tomorrow', offset: 1 },
                  { label: '+3 Days', offset: 3 },
                  { label: '+1 Week', offset: 7 },
                ].map((p) => {
                  const target = new Date();
                  target.setDate(target.getDate() + p.offset);
                  const isPresetActive = isSameDay(selectedDate, target);

                  return (
                    <Pressable
                      key={p.label}
                      style={[
                        styles.presetChip,
                        isPresetActive && styles.presetChipActive,
                      ]}
                      onPress={() => selectPreset(p.offset)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${p.label}`}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.presetChipText,
                          isPresetActive && styles.presetChipTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Month & Year Navigation Bar */}
              <View style={styles.monthNavRow}>
                <Pressable
                  onPress={prevMonth}
                  hitSlop={12}
                  style={styles.navArrowBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Feather name="chevron-left" size={20} color={theme.colors.text.primary} />
                </Pressable>

                <View style={styles.currentMonthBadge}>
                  <Text variant="heading" style={styles.currentMonthText}>
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </Text>
                </View>

                <Pressable
                  onPress={nextMonth}
                  hitSlop={12}
                  style={styles.navArrowBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Feather name="chevron-right" size={20} color={theme.colors.text.primary} />
                </Pressable>
              </View>

              {/* Weekday Column Headers */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((wd, i) => (
                  <Text key={`${wd}-${i}`} variant="caption" style={styles.weekdayLabel}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Calendar Days Matrix */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((item, index) => {
                  const isSelected = isSameDay(item.date, selectedDate);
                  const isCurrentToday = isSameDay(item.date, today);

                  const isDisabled =
                    (minDate && item.date < minDate) ||
                    (maxDate && item.date > maxDate);

                  return (
                    <Pressable
                      key={`day-${index}`}
                      disabled={isDisabled}
                      onPress={() => {
                        setSelectedDate(item.date);
                        if (!item.isCurrentMonth) {
                          setCurrentMonth(item.date.getMonth());
                          setCurrentYear(item.date.getFullYear());
                        }
                      }}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        !isSelected && isCurrentToday && styles.dayCellToday,
                        isDisabled && styles.dayCellDisabled,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.date.toDateString()}`}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.dayText,
                          !item.isCurrentMonth && styles.dayTextOutside,
                          isSelected && styles.dayTextSelected,
                          !isSelected && isCurrentToday && styles.dayTextToday,
                          isDisabled && styles.dayTextDisabled,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Optional Time Selector for DateTime mode */}
              {mode === 'datetime' && (
                <View style={styles.timeSection}>
                  <View style={styles.timeHeader}>
                    <Feather name="clock" size={14} color={theme.colors.text.secondary} />
                    <Text variant="caption" style={styles.timeHeaderLabel}>
                      Due Time: <Text variant="caption" style={styles.timeHeaderValue}>{selectedTime}</Text>
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeListRow}
                  >
                    {TIME_OPTIONS.map((timeOption) => {
                      const isTimeSelected = selectedTime === timeOption;
                      return (
                        <Pressable
                          key={timeOption}
                          style={[
                            styles.timePill,
                            isTimeSelected && styles.timePillSelected,
                          ]}
                          onPress={() => setSelectedTime(timeOption)}
                        >
                          <Text
                            variant="caption"
                            style={[
                              styles.timePillText,
                              isTimeSelected && styles.timePillTextSelected,
                            ]}
                          >
                            {timeOption}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.footerRow}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  size="sm"
                  onPress={onClose}
                  style={styles.cancelBtn}
                />
                <Button
                  title="Confirm Date"
                  variant="primary"
                  size="sm"
                  icon="check"
                  onPress={handleApply}
                  style={styles.confirmBtn}
                />
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

export interface DatePickerInputProps {
  label?: string;
  value?: string;
  onChange?: (formattedDate: string, rawDate: Date) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  modalTitle?: string;
  mode?: 'date' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder = 'Select Date',
  modalTitle,
  mode = 'date',
  minDate,
  maxDate,
  editable = true,
  style,
}: DatePickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const hasError = Boolean(error);
  const isDisabled = !editable;

  const handleOpen = () => {
    if (!isDisabled) {
      setModalVisible(true);
    }
  };

  const handleSelect = (formattedDate: string, rawDate: Date) => {
    onChange?.(formattedDate, rawDate);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={handleOpen}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label ? `Select ${label}` : 'Select date'}
        style={[
          styles.inputContainer,
          hasError && styles.inputError,
          isDisabled && styles.inputDisabled,
        ]}
      >
        <Feather
          name="calendar"
          size={18}
          color={hasError ? theme.colors.semantic.danger.main : theme.colors.text.secondary}
          style={styles.calendarIcon}
        />

        <Text
          variant="body"
          style={[
            styles.valueText,
            !value && styles.placeholderText,
            isDisabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Feather
          name="chevron-down"
          size={16}
          color={theme.colors.text.disabled}
          style={styles.chevronIcon}
        />
      </Pressable>

      {error ? (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}

      <DatePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelect}
        value={value}
        title={modalTitle || label || 'Select Date'}
        mode={mode}
        minDate={minDate}
        maxDate={maxDate}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');
const modalWidth = Math.min(width - 32, 360);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  inputContainer: {
    minHeight: theme.spacing.xxl,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
  },
  inputError: {
    borderColor: theme.colors.semantic.danger.main,
  },
  inputDisabled: {
    backgroundColor: theme.colors.background.screen,
    opacity: 0.6,
  },
  calendarIcon: {
    marginRight: theme.spacing.sm,
  },
  valueText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.base,
  },
  placeholderText: {
    color: theme.colors.text.disabled,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  chevronIcon: {
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.semantic.danger.main,
  },
  helperText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
  },

  // Modal Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  cardContainer: {
    width: modalWidth,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cardInner: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  presetChipActive: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  presetChipTextActive: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentMonthBadge: {
    alignItems: 'center',
  },
  currentMonthText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: 38,
    textAlign: 'center',
    color: theme.colors.text.disabled,
    fontWeight: theme.typography.weights.semibold,
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayCell: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary.main,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  dayTextOutside: {
    color: theme.colors.text.disabled,
    opacity: 0.5,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
  },
  dayTextToday: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  dayTextDisabled: {
    color: theme.colors.text.disabled,
  },
  timeSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timeHeaderLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  timeHeaderValue: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary.main,
  },
  timeListRow: {
    gap: 6,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.main,
  },
  timePillSelected: {
    backgroundColor: theme.colors.primary.bg,
    borderColor: theme.colors.primary.main,
  },
  timePillText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  timePillTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.weights.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1.4,
  },
});
