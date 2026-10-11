import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS } from '../../../constants/colors';
import RequestInput from '../components/RequestInput';
import RequestProgress from '../components/RequestProgress';
import RequestDateField from '../components/RequestDateField';
import { useEmergencyRequestDraft } from '../context/EmergencyRequestDraftContext';
import type { RequesterStackParamList } from '../navigation/types';
import { BLOOD_GROUPS, URGENCY_LEVELS, validateHospitalDetails, type HospitalFormErrors } from '../utils/hospitalValidation';

type Props = NativeStackScreenProps<RequesterStackParamList, 'HospitalDetails'>;

export default function HospitalDetailsScreen({ navigation, route }: Props) {
  const { hospitalForm, updateHospital, prepareDraft, clearPreparedDraft } = useEmergencyRequestDraft();
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const validation = hasAttemptedNext ? validateHospitalDetails(hospitalForm) : null;
  const errors: HospitalFormErrors = validation && !validation.valid ? validation.errors : {};

  function handleBack() {
    Keyboard.dismiss();
    navigation.goBack();
  }

  function handleNext() {
    Keyboard.dismiss();
    setHasAttemptedNext(true);
    const result = validateHospitalDetails(hospitalForm);
    if (result.valid) {
      prepareDraft({ patient: route.params.patient, ...result.details });
      navigation.navigate('ReviewRequest');
    } else {
      clearPreparedDraft();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Back to patient information">
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Emergency Blood Request</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <RequestProgress activeStep={2} />
          <Text style={styles.pageTitle}>Hospital Details</Text>
          <Text style={styles.description}>Add the blood requirement and hospital details. Fields marked * are required.</Text>

          <Text style={styles.sectionTitle}>Blood Requirement</Text>
          <ChoiceField label="Blood Group" options={BLOOD_GROUPS} value={hospitalForm.bloodGroup} error={errors.bloodGroup}
            onChange={bloodGroup => updateHospital({ bloodGroup })} />
          <RequestInput label="Units Required" icon="water-outline" placeholder="Enter number of units" error={errors.unitsRequired}
            accessibilityLabel="Units Required" keyboardType="number-pad" maxLength={6}
            value={hospitalForm.unitsRequired} onChangeText={unitsRequired => updateHospital({ unitsRequired })} />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Hospital Information</Text>
          <RequestInput label="Hospital Name" icon="business-outline" placeholder="Enter hospital name" error={errors.hospitalName}
            accessibilityLabel="Hospital Name" autoCapitalize="words" maxLength={160}
            value={hospitalForm.hospitalName} onChangeText={hospitalName => updateHospital({ hospitalName })} />
          <RequestInput label="Hospital Location" icon="location-outline" placeholder="Enter city or address" error={errors.hospitalLocation}
            accessibilityLabel="Hospital Location" maxLength={240}
            value={hospitalForm.hospitalLocation} onChangeText={hospitalLocation => updateHospital({ hospitalLocation })} />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Request Information</Text>
          <RequestDateField value={hospitalForm.requiredDate} error={errors.requiredDate} onChange={requiredDate => updateHospital({ requiredDate })} />
          <ChoiceField label="Urgency Level" options={URGENCY_LEVELS} value={hospitalForm.urgencyLevel} error={errors.urgencyLevel}
            onChange={urgencyLevel => updateHospital({ urgencyLevel })} />

          {Object.keys(errors).length > 0 ? (
            <View style={styles.message} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>Please correct the highlighted fields above.</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={handleBack} accessibilityRole="button"><Text style={styles.secondaryText}>Back</Text></Pressable>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={handleNext} accessibilityRole="button">
              <Text style={styles.primaryText}>Next</Text><Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChoiceField<T extends string>({ label, options, value, error, onChange }: {
  label: string; options: T[]; value: T | ''; error?: string; onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choiceField}>
      <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
      <View style={styles.choices}>
        {options.map(option => (
          <Pressable key={option} style={[styles.choice, error && styles.invalidChoice, value === option && styles.selectedChoice]}
            onPress={() => onChange(option)} accessibilityRole="radio" accessibilityLabel={`${label}: ${option}`}
            accessibilityState={{ checked: value === option }}>
            <Text style={[styles.choiceText, value === option && styles.selectedText]}>{option}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.fieldError} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: 44 },
  container: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28 },
  pageTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text },
  description: { marginTop: 7, marginBottom: 22, fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 4, marginBottom: 20 },
  choiceField: { marginBottom: 16 },
  label: { marginBottom: 7, fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  required: { color: COLORS.primary },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexGrow: 1, flexBasis: '21%', minHeight: 48, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBackground, alignItems: 'center', justifyContent: 'center' },
  invalidChoice: { borderColor: COLORS.danger },
  selectedChoice: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  choiceText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  selectedText: { color: COLORS.primary, fontWeight: '700' },
  fieldError: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginTop: 7 },
  message: { padding: 14, borderRadius: 10, backgroundColor: COLORS.white, marginBottom: 16 },
  errorText: { color: COLORS.danger, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: 10, backgroundColor: COLORS.primary,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  pressed: { opacity: 0.65 },
});
