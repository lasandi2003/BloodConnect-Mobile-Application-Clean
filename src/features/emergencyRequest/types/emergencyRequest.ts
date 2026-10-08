export type PatientGender = 'Male' | 'Female' | 'Other';

export interface PatientInformation {
  fullName: string;
  age: number;
  gender: PatientGender;
  contactNumber: string;
  representativeName: string;
  representativeContactNumber: string;
  relationshipToPatient: string;
}

// Text inputs remain strings until validation converts the age to a number.
export interface PatientInformationForm extends Omit<PatientInformation, 'age' | 'gender'> {
  age: string;
  gender: PatientGender | '';
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UrgencyLevel = 'Normal' | 'Urgent' | 'Critical';

export interface HospitalInformation {
  hospitalName: string;
  hospitalLocation: string;
}

export interface BloodRequirement {
  bloodGroup: BloodGroup;
  unitsRequired: number;
}

export interface HospitalDetailsForm extends HospitalInformation {
  bloodGroup: BloodGroup | '';
  unitsRequired: string;
  requiredDate: string;
  urgencyLevel: UrgencyLevel | '';
}

export interface EmergencyRequestDraft {
  patient: PatientInformation;
  hospital: HospitalInformation;
  bloodRequirement: BloodRequirement;
  requiredDate: string; // Local calendar date, YYYY-MM-DD; no time-zone conversion.
  urgencyLevel: UrgencyLevel;
}
