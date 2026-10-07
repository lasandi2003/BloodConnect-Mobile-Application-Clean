import type { PatientInformation, SubmittedRequestReceipt } from '../types/emergencyRequest';

export type RequesterStackParamList = {
  RequesterDashboard: undefined;
  PatientInformation: undefined;
  HospitalDetails: { patient: PatientInformation };
  ReviewRequest: undefined;
  RequestSubmitted: { receipt: SubmittedRequestReceipt };
};
