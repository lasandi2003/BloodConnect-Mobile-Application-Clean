import type {
  DonorResponseChoice,
} from '../types/donor';

export type DonorStackParamList = {
  DonorDashboard: undefined;
  FindDonationCentres: undefined;

  BloodRequests: undefined;

  RequestDetails: {
    requestId: string;
  };

  DonationConfirmation: {
    requestId: string;
    response: DonorResponseChoice;
  };

  DonationHistory: undefined;

  DonorProfile: undefined;
};
