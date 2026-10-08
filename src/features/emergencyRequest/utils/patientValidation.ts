import type { PatientGender, PatientInformation, PatientInformationForm } from '../types/emergencyRequest';

export const PATIENT_GENDERS: PatientGender[] = ['Male', 'Female', 'Other'];

export type PatientFormErrors = Partial<Record<keyof PatientInformationForm, string>>;

type PatientValidationResult =
  | { valid: true; patient: PatientInformation }
  | { valid: false; message: string; errors: PatientFormErrors };

function isValidContactNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  return /^\+?[\d\s()-]+$/.test(trimmed) && digits.length >= 7 && digits.length <= 15;
}

export function validatePatientInformation(form: PatientInformationForm): PatientValidationResult {
  const errors: PatientFormErrors = {};

  if (form.fullName.trim().length < 2) {
    errors.fullName = 'Enter the patient full name (at least 2 characters).';
  }

  const age = Number(form.age);
  if (!/^\d+$/.test(form.age.trim()) || !Number.isInteger(age) || age < 0 || age > 120) {
    errors.age = 'Enter a whole-number age between 0 and 120.';
  }

  if (!form.gender || !PATIENT_GENDERS.includes(form.gender)) {
    errors.gender = 'Select the patient gender.';
  }

  if (!isValidContactNumber(form.contactNumber)) {
    errors.contactNumber = 'Enter a patient contact number with 7 to 15 digits.';
  }

  if (form.representativeName.trim().length < 2) {
    errors.representativeName = 'Enter the representative name (at least 2 characters).';
  }

  if (!isValidContactNumber(form.representativeContactNumber)) {
    errors.representativeContactNumber = 'Enter a representative contact number with 7 to 15 digits.';
  }

  if (!form.relationshipToPatient.trim()) {
    errors.relationshipToPatient = 'Enter the relationship to the patient.';
  }

  const message = Object.values(errors)[0];
  if (message || !form.gender) {
    return { valid: false, message: message ?? 'Select the patient gender.', errors };
  }

  return {
    valid: true,
    patient: {
      fullName: form.fullName.trim(),
      age,
      gender: form.gender,
      contactNumber: form.contactNumber.trim(),
      representativeName: form.representativeName.trim(),
      representativeContactNumber: form.representativeContactNumber.trim(),
      relationshipToPatient: form.relationshipToPatient.trim(),
    },
  };
}
