import React, { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS } from '../../../constants/colors';
import RequestProgress from '../components/RequestProgress';
import { useEmergencyRequestDraft } from '../context/EmergencyRequestDraftContext';
import type { RequesterStackParamList } from '../navigation/types';
import { formatDisplayDate } from '../utils/hospitalValidation';

type Props = NativeStackScreenProps<RequesterStackParamList, 'ReviewRequest'>;

export default function ReviewRequestScreen({ navigation }: Props) {
  const { preparedDraft } = useEmergencyRequestDraft();
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);

  function editPatient() {
    navigation.popTo('PatientInformation');
  }

  function editHospital() {
    navigation.goBack();
  }

  if (!preparedDraft) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={40} color={COLORS.primary} />
          <Text style={styles.pageTitle}>No draft to review</Text>
          <Text style={styles.description}>Complete the patient and hospital information before reviewing your request.</Text>
          <Pressable style={[styles.primaryButton, styles.emptyButton]} onPress={editPatient} accessibilityRole="button">
            <Text style={styles.primaryText}>Patient Information</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { patient, hospital, bloodRequirement, requiredDate, urgencyLevel } = preparedDraft;
  const readableDate = formatDisplayDate(requiredDate);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={editHospital} accessibilityRole="button" accessibilityLabel="Back to hospital details">
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Emergency Blood Request</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <RequestProgress activeStep={3} />
        <Text style={styles.pageTitle}>Review Request</Text>
        <Text style={styles.description}>Check the details below. You can return to either form to make corrections.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Request at a glance</Text>
            <View style={[styles.urgencyBadge, urgencyLevel === 'Urgent' && styles.urgentBadge,
              urgencyLevel === 'Critical' && styles.criticalBadge]}>
              <Text style={[styles.urgencyText, urgencyLevel === 'Urgent' && styles.urgentText,
                urgencyLevel === 'Critical' && styles.criticalText]}>{urgencyLevel}</Text>
            </View>
          </View>
          <View style={styles.summaryNumbers}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Blood group</Text>
              <Text style={styles.summaryValue}>{bloodRequirement.bloodGroup}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Units required</Text>
              <Text style={styles.summaryValue}>{bloodRequirement.unitsRequired}</Text>
            </View>
          </View>
          <View style={styles.summaryDate}>
            <Ionicons name="calendar-outline" size={19} color={COLORS.primary} />
            <View style={styles.summaryDateText}>
              <Text style={styles.summaryLabel}>Required by</Text>
              <Text style={styles.summaryDateValue}>{readableDate}</Text>
            </View>
          </View>
        </View>

        <ReviewSection title="Patient Information" icon="person-outline" editLabel="Edit Patient" onEdit={editPatient} rows={[
          { label: 'Full name', value: patient.fullName },
          { label: 'Age', value: `${patient.age} years` },
          { label: 'Gender', value: patient.gender },
          { label: 'Contact number', value: patient.contactNumber },
        ]} />
        <ReviewSection title="Representative Details" icon="people-outline" editLabel="Edit Patient" onEdit={editPatient} rows={[
          { label: 'Name', value: patient.representativeName },
          { label: 'Contact number', value: patient.representativeContactNumber },
          { label: 'Relationship', value: patient.relationshipToPatient },
        ]} />
        <ReviewSection title="Blood Requirement" icon="water-outline" editLabel="Edit Hospital" onEdit={editHospital} rows={[
          { label: 'Blood group', value: bloodRequirement.bloodGroup },
          { label: 'Units required', value: String(bloodRequirement.unitsRequired) },
        ]} />
        <ReviewSection title="Hospital Information" icon="business-outline" editLabel="Edit Hospital" onEdit={editHospital} rows={[
          { label: 'Hospital name', value: hospital.hospitalName },
          { label: 'Location', value: hospital.hospitalLocation },
        ]} />
        <ReviewSection title="Request Information" icon="calendar-outline" editLabel="Edit Hospital" onEdit={editHospital} rows={[
          { label: 'Required date', value: readableDate },
          { label: 'Urgency level', value: urgencyLevel },
        ]} />

        <Pressable style={styles.confirmation} onPress={() => setDetailsConfirmed(previous => !previous)}
          accessibilityRole="checkbox" accessibilityState={{ checked: detailsConfirmed }}
          accessibilityLabel="I confirm these details are correct">
          <View style={[styles.checkbox, detailsConfirmed && styles.checkedBox]}>
            {detailsConfirmed ? <Ionicons name="checkmark" size={16} color={COLORS.white} /> : null}
          </View>
          <Text style={styles.confirmationText}>I confirm these details are correct.</Text>
        </Pressable>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={21} color={COLORS.primary} />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Unsaved draft</Text>
            <Text style={styles.noticeText}>Refreshing, closing the app or discarding this request will clear your details. Submission is coming soon; nothing has been submitted.</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={editHospital} accessibilityRole="button">
            <Text style={styles.secondaryText}>Back</Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, styles.disabledSubmit]} disabled accessibilityRole="button"
            accessibilityState={{ disabled: true }} accessibilityLabel="Submit Request, coming soon">
            <Text style={styles.disabledSubmitText}>Submit Request</Text>
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ReviewSectionProps {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  rows: { label: string; value: string }[];
  editLabel: string;
  onEdit: () => void;
}

function ReviewSection({ title, icon, rows, editLabel, onEdit }: ReviewSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}><Ionicons name={icon} size={18} color={COLORS.primary} /></View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Pressable style={styles.editButton} onPress={onEdit} accessibilityRole="button" accessibilityLabel={`${editLabel}: ${title}`}>
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editText}>{editLabel}</Text>
        </Pressable>
      </View>
      {rows.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={styles.rowValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.softBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: 44 },
  container: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28 },
  pageTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text },
  description: { marginTop: 7, marginBottom: 22, fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  summaryCard: { padding: 18, marginBottom: 20, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primaryLight },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  summaryTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.text },
  urgencyBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.softBackground },
  urgencyText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  urgentBadge: { backgroundColor: COLORS.warning },
  urgentText: { color: COLORS.text },
  criticalBadge: { backgroundColor: COLORS.danger },
  criticalText: { color: COLORS.white },
  summaryNumbers: { flexDirection: 'row', gap: 12 },
  summaryTile: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.softBackground },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  summaryValue: { marginTop: 8, fontSize: 30, fontWeight: '800', color: COLORS.primary },
  summaryDate: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  summaryDateText: { flex: 1 },
  summaryDateValue: { marginTop: 4, fontSize: 14, fontWeight: '700', color: COLORS.text },
  card: { padding: 16, marginBottom: 16, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.softBackground, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  editButton: { minHeight: 44, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 7 },
  rowLabel: { flex: 1, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  rowValue: { flex: 1.3, minWidth: 0, textAlign: 'right', fontSize: 13, lineHeight: 19, fontWeight: '600', color: COLORS.text },
  notice: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, backgroundColor: COLORS.white, marginBottom: 16 },
  noticeContent: { flex: 1 },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 5 },
  noticeText: { fontSize: 12, lineHeight: 19, color: COLORS.textSecondary },
  confirmation: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  checkedBox: { backgroundColor: COLORS.primary },
  confirmationText: { flex: 1, fontSize: 13, lineHeight: 20, color: COLORS.text },
  actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  primaryButton: { flex: 1.5, minHeight: 52, borderRadius: 10, paddingHorizontal: 12, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 14, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  disabledSubmit: { backgroundColor: COLORS.border, paddingVertical: 10 },
  disabledSubmitText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  comingSoonText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
  emptyButton: { flex: 0 },
});
