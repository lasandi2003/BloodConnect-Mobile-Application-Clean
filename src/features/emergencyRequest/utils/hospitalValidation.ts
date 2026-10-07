import type { BloodGroup, EmergencyRequestDraft, HospitalDetailsForm, UrgencyLevel } from '../types/emergencyRequest';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const URGENCY_LEVELS: UrgencyLevel[] = ['Normal', 'Urgent', 'Critical'];
export type HospitalFormErrors = Partial<Record<keyof HospitalDetailsForm, string>>;

export function toCalendarDate(date: Date) {
  return [String(date.getFullYear()).padStart(4, '0'), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}

export function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

type HospitalValidationResult =
  | { valid: false; errors: HospitalFormErrors }
  | { valid: true; details: Omit<EmergencyRequestDraft, 'patient'> };

export function validateHospitalDetails(form: HospitalDetailsForm, today = new Date()): HospitalValidationResult {
  const errors: HospitalFormErrors = {};
  const unitsRequired = Number(form.unitsRequired);

  if (!form.bloodGroup || !BLOOD_GROUPS.includes(form.bloodGroup)) errors.bloodGroup = 'Select a blood group.';
  if (!/^\d+$/.test(form.unitsRequired.trim()) || !Number.isSafeInteger(unitsRequired) || unitsRequired < 1) {
    errors.unitsRequired = 'Enter a positive whole number of units.';
  }
  if (!form.hospitalName.trim()) errors.hospitalName = 'Enter the hospital name.';
  if (!form.hospitalLocation.trim()) errors.hospitalLocation = 'Enter the hospital location.';
  if (!parseCalendarDate(form.requiredDate)) {
    errors.requiredDate = 'Select a valid required date.';
  } else if (form.requiredDate < toCalendarDate(today)) {
    errors.requiredDate = 'Select today or a future date.';
  }
  if (!form.urgencyLevel || !URGENCY_LEVELS.includes(form.urgencyLevel)) errors.urgencyLevel = 'Select an urgency level.';

  if (Object.keys(errors).length > 0 || !form.bloodGroup || !form.urgencyLevel) return { valid: false, errors };

  return {
    valid: true,
    details: {
      hospital: { hospitalName: form.hospitalName.trim(), hospitalLocation: form.hospitalLocation.trim() },
      bloodRequirement: { bloodGroup: form.bloodGroup, unitsRequired },
      requiredDate: form.requiredDate,
      urgencyLevel: form.urgencyLevel,
    },
  };
}
