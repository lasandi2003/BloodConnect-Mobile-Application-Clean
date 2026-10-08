import type { PatientInformation } from '../types/emergencyRequest';

export type RequesterStackParamList = {
  RequesterDashboard: undefined;
  PatientInformation: undefined;
  HospitalDetails: { patient: PatientInformation };
  ReviewRequest: undefined;
};
