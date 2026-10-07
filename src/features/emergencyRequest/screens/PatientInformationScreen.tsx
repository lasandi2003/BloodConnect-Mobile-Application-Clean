import React, { useState } from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePreventRemove, type NavigationAction } from '@react-navigation/native';

import { COLORS } from '../../../constants/colors';
import type { RequesterStackParamList } from '../navigation/types';
import type { PatientInformationForm } from '../types/emergencyRequest';
import { PATIENT_GENDERS, validatePatientInformation, type PatientFormErrors } from '../utils/patientValidation';
import PatientField from '../components/RequestInput';
import RequestProgress from '../components/RequestProgress';
import { useEmergencyRequestDraft } from '../context/EmergencyRequestDraftContext';

type Props = NativeStackScreenProps<RequesterStackParamList, 'PatientInformation'>;

const initialForm: PatientInformationForm = {
  fullName: '',
  age: '',
  gender: '',
  contactNumber: '',
  representativeName: '',
  representativeContactNumber: '',
  relationshipToPatient: '',
};

export default function PatientInformationScreen({ navigation }: Props) {
  const [form, setForm] = useState<PatientInformationForm>(initialForm);
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const { clearPreparedDraft, resetDraft } = useEmergencyRequestDraft();
  const [pendingLeaveAction, setPendingLeaveAction] = useState<NavigationAction | null>(null);
  const validation = hasAttemptedNext ? validatePatientInformation(form) : null;
  const errors: PatientFormErrors = validation && !validation.valid ? validation.errors : {};
  const hasEnteredInformation = Object.values(form).some(value => value.trim().length > 0);

  usePreventRemove(hasEnteredInformation, ({ data }) => {
    Keyboard.dismiss();
    setPendingLeaveAction(data.action);
  });

  function keepEditing() {
    setPendingLeaveAction(null);
  }

  function discardInformation() {
    if (pendingLeaveAction) {
      resetDraft();
      navigation.dispatch(pendingLeaveAction);
      setPendingLeaveAction(null);
    }
  }

  function updateForm(values: Partial<PatientInformationForm>) {
    setForm(previous => ({ ...previous, ...values }));
    clearPreparedDraft();
  }

  function handleCancel() {
    Keyboard.dismiss();
    if (!hasEnteredInformation) resetDraft();
    navigation.goBack();
  }

  function handleNext() {
    Keyboard.dismiss();
    setHasAttemptedNext(true);
    const result = validatePatientInformation(form);

    if (!result.valid) {
      clearPreparedDraft();
      return;
    }

    navigation.navigate('HospitalDetails', { patient: result.patient });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleCancel}
            accessibilityRole="button" accessibilityLabel="Back to requester dashboard">
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Emergency Blood Request</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <RequestProgress activeStep={1} />

          <Text style={styles.pageTitle}>Patient Information</Text>
          <Text style={styles.description}>Enter the patient and representative details. Fields marked * are required.</Text>

          <PatientField label="Patient Full Name" error={errors.fullName} icon="person-outline" placeholder="Enter full name"
            accessibilityLabel="Patient Full Name" autoCapitalize="words" maxLength={120}
            value={form.fullName} onChangeText={fullName => updateForm({ fullName })} />

          <View style={styles.detailsRow}>
            <View style={styles.ageField}>
              <PatientField label="Age" error={errors.age} icon="calendar-outline" placeholder="Years"
                accessibilityLabel="Age" keyboardType="number-pad" maxLength={3}
                value={form.age} onChangeText={age => updateForm({ age })} />
            </View>
            <View style={styles.genderField}>
              <Text style={styles.fieldLabel}>Gender <Text style={styles.requiredMarker}>*</Text></Text>
              <View style={styles.genderChoices}>
                {PATIENT_GENDERS.map(gender => (
                  <Pressable key={gender} onPress={() => updateForm({ gender })}
                    style={[styles.genderChoice, form.gender === gender && styles.selectedChoice]}
                    accessibilityRole="radio" accessibilityLabel={`Gender: ${gender}`}
                    accessibilityState={{ checked: form.gender === gender }}>
                    <Text style={[styles.genderText, form.gender === gender && styles.selectedText]}>{gender}</Text>
                  </Pressable>
                ))}
              </View>
              {errors.gender ? (
                <Text style={styles.genderError} accessibilityRole="alert">{errors.gender}</Text>
              ) : null}
            </View>
          </View>

          <PatientField label="Patient Contact Number" error={errors.contactNumber} icon="call-outline" placeholder="e.g. +94 77 123 4567"
            accessibilityLabel="Patient Contact Number" keyboardType="phone-pad" maxLength={25}
            value={form.contactNumber} onChangeText={contactNumber => updateForm({ contactNumber })} />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Representative Details</Text>
          <PatientField label="Representative Name" error={errors.representativeName} icon="person-outline" placeholder="Enter representative name"
            accessibilityLabel="Representative Name" autoCapitalize="words" maxLength={120}
            value={form.representativeName} onChangeText={representativeName => updateForm({ representativeName })} />
          <PatientField label="Representative Contact Number" error={errors.representativeContactNumber} icon="call-outline" placeholder="e.g. +94 77 123 4567"
            accessibilityLabel="Representative Contact Number" keyboardType="phone-pad" maxLength={25}
            value={form.representativeContactNumber}
            onChangeText={representativeContactNumber => updateForm({ representativeContactNumber })} />
          <PatientField label="Relationship to Patient" error={errors.relationshipToPatient} icon="people-outline" placeholder="e.g. Parent, spouse, sibling"
            accessibilityLabel="Relationship to Patient" maxLength={80}
            value={form.relationshipToPatient} onChangeText={relationshipToPatient => updateForm({ relationshipToPatient })} />

          {Object.keys(errors).length > 0 ? (
            <View style={styles.message} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>Please correct the highlighted fields above.</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={handleCancel} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
              onPress={handleNext} accessibilityRole="button">
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={pendingLeaveAction !== null} transparent animationType="fade" onRequestClose={keepEditing}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.discardIcon}>
              <Ionicons name="alert-circle-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Discard patient information?</Text>
            <Text style={styles.modalDescription}>The details you entered will be lost if you leave this page.</Text>
            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={keepEditing} accessibilityRole="button">
                <Text style={styles.cancelText}>Keep Editing</Text>
              </Pressable>
              <Pressable style={styles.nextButton} onPress={discardInformation} accessibilityRole="button">
                <Text style={styles.nextText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  detailsRow: { flexDirection: 'row', gap: 12 },
  ageField: { flex: 1 },
  genderField: { flex: 2, marginBottom: 16 },
  fieldLabel: { marginBottom: 7, fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  genderChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genderChoice: { flexGrow: 1, minHeight: 52, paddingHorizontal: 8, borderRadius: 10,
    backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center' },
  selectedChoice: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  genderText: { fontSize: 12, color: COLORS.textSecondary },
  selectedText: { color: COLORS.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 4, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
  message: { padding: 14, borderRadius: 10, backgroundColor: COLORS.white, marginBottom: 16 },
  errorText: { color: COLORS.danger, fontSize: 13, lineHeight: 20 },
  requiredMarker: { color: COLORS.primary },
  genderError: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelButton: { flex: 1, minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  nextButton: { flex: 1, minHeight: 52, borderRadius: 10, backgroundColor: COLORS.primary,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  pressed: { opacity: 0.65 },
  modalOverlay: { flex: 1, padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '100%', maxWidth: 360, padding: 22, borderRadius: 20, backgroundColor: COLORS.white },
  discardIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.softBackground,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { textAlign: 'center', fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalDescription: { textAlign: 'center', fontSize: 13, lineHeight: 20, color: COLORS.textSecondary,
    marginTop: 10, marginBottom: 12 },
});
