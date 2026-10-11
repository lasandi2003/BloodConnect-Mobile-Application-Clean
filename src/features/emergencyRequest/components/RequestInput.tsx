import React, { type ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';

interface Props extends TextInputProps {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  error?: string;
}

export default function RequestInput({ error, label, icon, ...props }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
      <View style={[styles.container, error && styles.invalid]}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <TextInput {...props} style={styles.input} placeholderTextColor={COLORS.textMuted}
          accessibilityHint={error ?? 'Required field'} />
      </View>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16, minWidth: 0 },
  label: { marginBottom: 7, fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  required: { color: COLORS.primary },
  container: { minHeight: 52, borderRadius: 10, backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.inputBackground },
  invalid: { borderColor: COLORS.danger },
  input: { flex: 1, minWidth: 0, marginLeft: 10, fontSize: 15, color: COLORS.text },
  error: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginTop: 7 },
});
