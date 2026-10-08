import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { parseCalendarDate, toCalendarDate } from '../utils/hospitalValidation';

interface Props {
  value: string;
  error?: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

export default function RequestDateField({ value, error, onChange, disabled }: Props) {
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const today = toCalendarDate(new Date());
  const firstDay = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const previousDisabled = toCalendarDate(month).slice(0, 7) <= today.slice(0, 7);

  function openCalendar() {
    const selected = parseCalendarDate(value) ?? new Date();
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setVisible(true);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Required Date <Text style={styles.required}>*</Text></Text>
      <Pressable style={[styles.dateButton, error && styles.invalid]} onPress={openCalendar} disabled={disabled}
        accessibilityState={{ disabled: Boolean(disabled) }}
        accessibilityRole="button" accessibilityLabel={`Required Date: ${value || 'Select a date'}`}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Select required date'}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </Pressable>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.calendar} accessibilityViewIsModal>
            <Text style={styles.calendarTitle}>Select required date</Text>
            <View style={styles.monthRow}>
              <Pressable disabled={previousDisabled} style={styles.monthButton}
                onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                accessibilityRole="button" accessibilityLabel="Previous month" accessibilityState={{ disabled: previousDisabled }}>
                <Ionicons name="chevron-back" size={22} color={previousDisabled ? COLORS.textMuted : COLORS.primary} />
              </Pressable>
              <Text style={styles.monthTitle}>{month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</Text>
              <Pressable style={styles.monthButton}
                onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                accessibilityRole="button" accessibilityLabel="Next month">
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}
              {cells.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const dateValue = toCalendarDate(date);
                const disabled = dateValue < today;
                const selected = dateValue === value;
                return (
                  <Pressable key={dateValue} disabled={disabled} style={styles.dayCell}
                    accessibilityRole="button" accessibilityLabel={date.toDateString()}
                    accessibilityState={{ disabled, selected }}
                    onPress={() => { onChange(dateValue); setVisible(false); }}>
                    <View style={[styles.dayCircle, selected && styles.selectedDay]}>
                      <Text style={[styles.dayText, disabled && styles.disabledDay, selected && styles.selectedText]}>{date.getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>Choose today or a future date.</Text>
            <Pressable style={styles.closeButton} onPress={() => setVisible(false)} accessibilityRole="button">
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 7 },
  required: { color: COLORS.primary },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14,
    borderRadius: 10, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.inputBackground },
  invalid: { borderColor: COLORS.danger },
  value: { flex: 1, fontSize: 15, color: COLORS.text },
  placeholder: { color: COLORS.textMuted },
  error: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginTop: 7 },
  overlay: { flex: 1, padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center' },
  calendar: { width: '100%', maxWidth: 360, backgroundColor: COLORS.white, borderRadius: 20, padding: 16 },
  calendarTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.285714%', textAlign: 'center', fontSize: 11, color: COLORS.textSecondary, paddingBottom: 8 },
  dayCell: { width: '14.285714%', height: 44, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  selectedDay: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 14, color: COLORS.text },
  disabledDay: { color: COLORS.textMuted },
  selectedText: { color: COLORS.white, fontWeight: '700' },
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 12 },
  closeButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
    backgroundColor: COLORS.softBackground, marginTop: 16 },
  closeText: { color: COLORS.primary, fontWeight: '700' },
});
