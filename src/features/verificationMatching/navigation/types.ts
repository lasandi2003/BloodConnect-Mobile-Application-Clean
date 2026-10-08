export type VerificationMatchingStackParamList = {
  Dashboard: undefined;
  PendingBloodRequests: undefined;
  RequestVerification: {
    requestId: string;
  };
  MatchingDonors: {
    requestId: string;
    selectedDonorId?: string;
  };
  DonorDetails: {
    requestId: string;
    donorId: string;
    donorAlreadySelected: boolean;
    canSelectDonor: boolean;
  };
  MatchConfirmation: {
    requestId: string;
    donorId: string;
  };
  NotificationStatus: {
    requestId: string;
    donorId: string;
  };
  DonorCommunication: {
    requestId: string;
    donorId: string;
  };
  MatchingHistory: undefined | {
    requestId: string;
    donorId: string;
  };
};
