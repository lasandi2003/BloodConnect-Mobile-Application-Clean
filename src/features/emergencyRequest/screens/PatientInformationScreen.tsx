import React, { useState, type ComponentProps } from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePreventRemove, type NavigationAction } from '@react-navigation/native';

import { COLORS } from '../../../constants/colors';
import type { RequesterStackParamList } from '../navigation/types';
import type { PatientInformation, PatientInformationForm } from '../types/emergencyRequest';
import { PATIENT_GENDERS, validatePatientInformation, type PatientFormErrors } from '../utils/patientValidation';

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
  const [preparedPatient, setPreparedPatient] = useState<PatientInformation | null>(null);
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
      navigation.dispatch(pendingLeaveAction);
      setPendingLeaveAction(null);
    }
  }

  function updateForm(values: Partial<PatientInformationForm>) {
    setForm(previous => ({ ...previous, ...values }));
    setPreparedPatient(null);
  }

  function handleCancel() {
    Keyboard.dismiss();
    navigation.goBack();
  }

  function handleNext() {
    Keyboard.dismiss();
    setHasAttemptedNext(true);
    const result = validatePatientInformation(form);

    if (!result.valid) {
      setPreparedPatient(null);
      return;
    }

    // Temporary local data only. The hospital page will consume this in the next step.
    setPreparedPatient(result.patient);
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
          <View style={styles.progress} accessible accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: 3, now: 1, text: 'Step 1 of 3: Patient information' }}>
            <View style={styles.progressHeading}>
              <Text style={styles.progressTitle}>Request progress</Text>
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>Step 1 of 3</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressLine} />
              {['Patient', 'Hospital', 'Review'].map((step, index) => (
                <View key={step} style={styles.progressStep}>
                  <View style={[styles.stepHalo, index === 0 && styles.activeHalo]}>
                    <View style={[styles.stepCircle, index === 0 && styles.activeCircle]}>
                      <Text style={[styles.stepNumber, index === 0 && styles.activeNumber]}>{index + 1}</Text>
                    </View>
                  </View>
                  <Text style={[styles.stepLabel, index === 0 && styles.activeLabel]}>{step}</Text>
                  <Text style={styles.stepStatus}>{index === 0 ? 'In progress' : 'Upcoming'}</Text>
                </View>
              ))}
            </View>
          </View>

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
          {preparedPatient ? (
            <View style={styles.message} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text style={styles.successTitle}>Patient details validated</Text>
              <Text style={styles.messageText}>Your information is held on this page. Hospital Details will be connected next. No request has been submitted.</Text>
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

interface PatientFieldProps extends TextInputProps {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  error?: string;
}

function PatientField({ error, label, icon, ...props }: PatientFieldProps) {
  return (
    <View style={styles.patientField}>
      <Text style={styles.fieldLabel}>{label} <Text style={styles.requiredMarker}>*</Text></Text>
      <View style={[styles.inputContainer, error && styles.invalidInput]}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <TextInput {...props} style={styles.input} placeholderTextColor={COLORS.textMuted}
          accessibilityHint={error ?? 'Required field'} />
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
  progress: { marginBottom: 26, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18,
    backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressTitle: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  progressBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.softBackground },
  progressBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  progressTrack: { flexDirection: 'row', marginTop: 16 },
  progressLine: { position: 'absolute', top: 21, left: '16.67%', right: '16.67%', height: 2,
    borderRadius: 1, backgroundColor: COLORS.border },
  progressStep: { flex: 1, alignItems: 'center' },
  stepHalo: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center' },
  activeHalo: { backgroundColor: COLORS.primaryLight },
  stepCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground, alignItems: 'center', justifyContent: 'center' },
  activeCircle: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNumber: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  activeNumber: { color: COLORS.white },
  stepLabel: { marginTop: 8, fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  activeLabel: { color: COLORS.primary, fontWeight: '800' },
  stepStatus: { marginTop: 4, fontSize: 10, color: COLORS.textSecondary },
  pageTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text },
  description: { marginTop: 7, marginBottom: 22, fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  detailsRow: { flexDirection: 'row', gap: 12 },
  ageField: { flex: 1 },
  genderField: { flex: 2, marginBottom: 16 },
  fieldLabel: { marginBottom: 7, fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  patientField: { marginBottom: 16, minWidth: 0 },
  inputContainer: { minHeight: 52, borderRadius: 10, backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.inputBackground },
  invalidInput: { borderColor: COLORS.danger },
  input: { flex: 1, minWidth: 0, marginLeft: 10, fontSize: 15, color: COLORS.text },
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
  fieldError: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginTop: 7 },
  genderError: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginTop: 7 },
  successTitle: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  messageText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 5 },
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
