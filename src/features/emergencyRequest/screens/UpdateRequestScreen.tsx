import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove, type NavigationAction } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../auth/context/AuthContext';
import RequestInput from '../components/RequestInput';
import RequestDateField from '../components/RequestDateField';
import type { RequesterStackParamList } from '../navigation/types';
import type { RequestStatusDetails, UpdateRequestForm } from '../types/emergencyRequest';
import { getRequestForUpdate, getRequestUpdateErrorMessage, updateEmergencyRequest } from '../services/emergencyRequestService';
import { canUpdateRequest } from '../utils/requestStatus';
import { URGENCY_LEVELS, validateHospitalDetails } from '../utils/hospitalValidation';

type Props = NativeStackScreenProps<RequesterStackParamList, 'UpdateRequest'>;

export default function UpdateRequestScreen({ navigation, route }: Props) {
  const requestId = route.params.requestId;
  const { user, profile } = useAuth();
  const [baseline, setBaseline] = useState<RequestStatusDetails | null>(null);
  const [form, setForm] = useState<UpdateRequestForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<NavigationAction | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);
  const savingLock = useRef(false);
  const dirty = Boolean(form && baseline && (form.unitsRequired !== String(baseline.unitsRequired)
    || form.hospitalName !== baseline.hospitalName || form.hospitalLocation !== baseline.location
    || form.requiredDate !== baseline.requiredDate || form.urgencyLevel !== baseline.urgencyLevel));
  const editable = Boolean(baseline && canUpdateRequest(baseline.status, baseline.verified));
  const validation = attemptedSave && form && baseline ? validateHospitalDetails({ ...form, bloodGroup: baseline.bloodGroup }) : null;
  const errors = validation && !validation.valid ? validation.errors : {};

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setForm(null); setBaseline(null); setAttemptedSave(false);
    if (!user || profile?.role !== 'requester' || profile.status !== 'active') {
      setError('Please sign in with an active requester account.'); setLoading(false);
      return;
    }
    getRequestForUpdate(requestId, user.uid).then(data => {
      if (!active) return;
      setBaseline(data);
      setForm({ unitsRequired: String(data.unitsRequired), hospitalName: data.hospitalName,
        hospitalLocation: data.location, requiredDate: data.requiredDate, urgencyLevel: data.urgencyLevel });
      setLoading(false);
    }).catch(failure => { if (active) { setError(getRequestUpdateErrorMessage(failure)); setLoading(false); } });
    return () => { active = false; };
  }, [requestId, user?.uid, profile?.role, profile?.status, retry]);

  usePreventRemove((dirty || saving) && !saved, ({ data }) => {
    Keyboard.dismiss();
    if (savingLock.current) setError('Saving is in progress. Please wait for confirmation.');
    else setPendingLeaveAction(data.action);
  });

  useEffect(() => {
    if (saved) navigation.popTo('RequestStatus', { requestId, updateSaved: true });
  }, [saved, navigation, requestId]);

  function updateForm(values: Partial<UpdateRequestForm>) {
    setForm(previous => previous ? { ...previous, ...values } : previous);
    setError('');
  }

  function reloadDetails() {
    if (dirty) setConfirmReload(true);
    else setRetry(previous => previous + 1);
  }

  function keepEditing() { setPendingLeaveAction(null); setConfirmReload(false); }

  function discardChanges() {
    if (confirmReload) setRetry(previous => previous + 1);
    else if (pendingLeaveAction) navigation.dispatch(pendingLeaveAction);
    keepEditing();
  }

  async function handleSave() {
    if (!user || !form || !baseline || !editable || !dirty || savingLock.current) return;
    Keyboard.dismiss(); setAttemptedSave(true);
    const result = validateHospitalDetails({ ...form, bloodGroup: baseline.bloodGroup });
    if (!result.valid) return;
    savingLock.current = true; setSaving(true); setError('');
    try {
      await updateEmergencyRequest(requestId, user.uid, form, baseline);
      setSaved(true);
    } catch (failure) { setError(getRequestUpdateErrorMessage(failure)); }
    finally { savingLock.current = false; setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} disabled={saving} accessibilityRole="button" accessibilityLabel="Back to request status">
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Update Request</Text><View style={styles.spacer} />
        </View>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Update Request</Text>
          <Text selectable style={styles.requestId}>{requestId}</Text>
          {loading ? <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /><Text style={styles.description}>Loading saved details...</Text></View> : null}
          {error ? <View style={styles.message} accessibilityRole="alert"><Text style={styles.errorText}>{error}</Text>
            {!saving ? <Pressable style={styles.reloadButton} onPress={reloadDetails} accessibilityRole="button"><Text style={styles.secondaryText}>Reload Saved Details</Text></Pressable> : null}
          </View> : null}
          {baseline && form ? (
            <>
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Blood Group: {baseline.bloodGroup}</Text>
                <Text style={styles.description}>Patient details and blood group stay as originally submitted.</Text>
              </View>
              {!editable ? <Text style={styles.errorText}>Only requests awaiting verification can be edited. Return to Status to view this request.</Text> : (
                <>
                  <Text style={styles.description}>Change the details below. Fields marked * are required.</Text>
                  <RequestInput label="Units Required" icon="water-outline" error={errors.unitsRequired} accessibilityLabel="Units Required"
                    keyboardType="number-pad" maxLength={6} editable={!saving} value={form.unitsRequired} onChangeText={unitsRequired => updateForm({ unitsRequired })} />
                  <RequestInput label="Hospital Name" icon="business-outline" error={errors.hospitalName} accessibilityLabel="Hospital Name"
                    maxLength={160} editable={!saving} value={form.hospitalName} onChangeText={hospitalName => updateForm({ hospitalName })} />
                  <RequestInput label="Hospital Location" icon="location-outline" error={errors.hospitalLocation} accessibilityLabel="Hospital Location"
                    maxLength={240} editable={!saving} value={form.hospitalLocation} onChangeText={hospitalLocation => updateForm({ hospitalLocation })} />
                  <RequestDateField value={form.requiredDate} error={errors.requiredDate} disabled={saving} onChange={requiredDate => updateForm({ requiredDate })} />
                  <Text style={styles.label}>Urgency Level <Text style={styles.errorText}>*</Text></Text>
                  <View style={styles.choices}>
                    {URGENCY_LEVELS.map(urgencyLevel => <Pressable key={urgencyLevel} disabled={saving}
                      style={[styles.choice, form.urgencyLevel === urgencyLevel && styles.selectedChoice]}
                      onPress={() => updateForm({ urgencyLevel })} accessibilityRole="radio" accessibilityState={{ checked: form.urgencyLevel === urgencyLevel, disabled: saving }}>
                      <Text style={styles.secondaryText}>{urgencyLevel}</Text>
                    </Pressable>)}
                  </View>
                  {errors.urgencyLevel ? <Text style={styles.errorText} accessibilityRole="alert">{errors.urgencyLevel}</Text> : null}
                  <View style={styles.actions}>
                    <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()} disabled={saving} accessibilityRole="button"><Text style={styles.secondaryText}>Back</Text></Pressable>
                    <Pressable style={[styles.primaryButton, (!dirty || saving) && styles.disabled]} onPress={handleSave} disabled={!dirty || saving}
                      accessibilityRole="button" accessibilityState={{ disabled: !dirty || saving, busy: saving }}>
                      {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : null}
                      <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={Boolean(pendingLeaveAction) || confirmReload} transparent animationType="fade" onRequestClose={keepEditing}>
        <View style={styles.overlay}><View style={styles.modal} accessibilityViewIsModal>
          <Text style={styles.summaryTitle}>Discard unsaved changes?</Text>
          <Text style={styles.description}>{confirmReload ? 'Reloading replaces your edits with the latest saved details.' : 'Your changes will be lost if you leave this page.'}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={keepEditing} accessibilityRole="button"><Text style={styles.secondaryText}>Keep Editing</Text></Pressable>
            <Pressable style={styles.primaryButton} onPress={discardChanges} accessibilityRole="button"><Text style={styles.primaryText}>{confirmReload ? 'Reload' : 'Discard'}</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: COLORS.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text }, spacer: { width: 44 },
  container: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28 },
  pageTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text },
  requestId: { fontSize: 13, color: COLORS.primary, marginTop: 8, marginBottom: 20 },
  description: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary, marginTop: 8, marginBottom: 18 },
  loading: { alignItems: 'center', padding: 24 },
  summary: { padding: 16, borderRadius: 14, backgroundColor: COLORS.white, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  message: { padding: 14, borderRadius: 12, backgroundColor: COLORS.white, marginBottom: 16 },
  errorText: { color: COLORS.danger, fontSize: 12, lineHeight: 18 },
  reloadButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 7 },
  choices: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  choice: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground, alignItems: 'center', justifyContent: 'center' },
  selectedChoice: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  primaryButton: { flex: 1.3, minHeight: 52, borderRadius: 10, paddingHorizontal: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', gap: 5 },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '700' }, disabled: { opacity: 0.5 },
  overlay: { flex: 1, padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center' },
  modal: { width: '100%', maxWidth: 360, padding: 22, borderRadius: 20, backgroundColor: COLORS.white },
});
