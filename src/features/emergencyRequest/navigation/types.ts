import type { PatientInformation, SubmittedRequestReceipt } from '../types/emergencyRequest';

export type RequesterStackParamList = {
  RequesterDashboard: undefined;
  PatientInformation: undefined;
  HospitalDetails: { patient: PatientInformation };
  ReviewRequest: undefined;
  RequestSubmitted: { receipt: SubmittedRequestReceipt };
  RequestStatus: { requestId: string; updateSaved?: boolean; cancelSaved?: boolean };
  UpdateRequest: { requestId: string };
  CancelRequest: { requestId: string };
};
