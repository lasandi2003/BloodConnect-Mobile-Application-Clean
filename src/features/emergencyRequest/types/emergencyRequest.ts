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
