import type { EmergencyRequestDraft, SubmittedRequestReceipt } from '../types/emergencyRequest';
import { validatePatientInformation } from './patientValidation';
import { BLOOD_GROUPS, parseCalendarDate, validateHospitalDetails } from './hospitalValidation';

export function buildRequestRecord(draft: EmergencyRequestDraft, requesterId: string, today = new Date()) {
  if (!requesterId) throw new Error('Please sign in again before submitting.');
  const patientResult = validatePatientInformation({ ...draft.patient, age: String(draft.patient.age) });
  if (!patientResult.valid) throw new Error(patientResult.message);
  const hospitalResult = validateHospitalDetails({
    ...draft.hospital, ...draft.bloodRequirement, unitsRequired: String(draft.bloodRequirement.unitsRequired),
    requiredDate: draft.requiredDate, urgencyLevel: draft.urgencyLevel,
  }, today);
  if (!hospitalResult.valid) throw new Error(Object.values(hospitalResult.errors)[0] ?? 'Please check hospital details.');
  const { patient } = patientResult;
  const { hospital, bloodRequirement, requiredDate, urgencyLevel } = hospitalResult.details;
  const urgency = { Normal: 'normal', Urgent: 'urgent', Critical: 'critical' } as const;

  // Flat fields match the donor module's existing emergencyRequests reader.
  return {
    requesterId, patient, patientName: patient.fullName,
    bloodGroup: bloodRequirement.bloodGroup, unitsRequired: bloodRequirement.unitsRequired,
    hospitalName: hospital.hospitalName, location: hospital.hospitalLocation,
    requiredDate, urgency: urgency[urgencyLevel],
    contactName: patient.representativeName, contactPhone: patient.representativeContactNumber,
    notes: '', status: 'pending_verification' as const, verified: false,
  };
}

export function buildSubmissionReceipt(requestId: string, record: ReturnType<typeof buildRequestRecord>): SubmittedRequestReceipt {
  const urgency = { normal: 'Normal', urgent: 'Urgent', critical: 'Critical' } as const;
  if (!BLOOD_GROUPS.includes(record.bloodGroup) || !Number.isSafeInteger(record.unitsRequired) || record.unitsRequired < 1
    || typeof record.hospitalName !== 'string' || !record.hospitalName.trim()
    || typeof record.requiredDate !== 'string' || !parseCalendarDate(record.requiredDate)
    || !Object.prototype.hasOwnProperty.call(urgency, record.urgency)
    || typeof record.status !== 'string' || !record.status.trim()) {
    throw new Error(`The saved request details could not be loaded. Please contact the project administrator with request ID ${requestId}.`);
  }
  return {
    requestId, bloodGroup: record.bloodGroup, unitsRequired: record.unitsRequired,
    hospitalName: record.hospitalName, requiredDate: record.requiredDate,
    urgencyLevel: urgency[record.urgency], status: record.status,
  };
}
