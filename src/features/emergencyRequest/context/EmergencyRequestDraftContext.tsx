import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { EmergencyRequestDraft, HospitalDetailsForm, SubmittedRequestReceipt } from '../types/emergencyRequest';

const emptyHospitalForm: HospitalDetailsForm = {
  bloodGroup: '', unitsRequired: '', hospitalName: '', hospitalLocation: '', requiredDate: '', urgencyLevel: '',
};

interface DraftContextValue {
  hospitalForm: HospitalDetailsForm;
  preparedDraft: EmergencyRequestDraft | null;
  submissionId: string | null;
  submittedRequest: SubmittedRequestReceipt | null;
  setSubmissionId: (id: string) => void;
  completeSubmission: (receipt: SubmittedRequestReceipt) => void;
  updateHospital: (values: Partial<HospitalDetailsForm>) => void;
  prepareDraft: (draft: EmergencyRequestDraft) => void;
  clearPreparedDraft: () => void;
  resetDraft: () => void;
}

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

export function EmergencyRequestDraftProvider({ children }: { children: ReactNode }) {
  const [hospitalForm, setHospitalForm] = useState<HospitalDetailsForm>(emptyHospitalForm);
  const [preparedDraft, setPreparedDraft] = useState<EmergencyRequestDraft | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<SubmittedRequestReceipt | null>(null);

  function updateHospital(values: Partial<HospitalDetailsForm>) {
    setHospitalForm(previous => ({ ...previous, ...values }));
    setPreparedDraft(null);
  }

  function resetDraft() {
    setHospitalForm({ ...emptyHospitalForm });
    setPreparedDraft(null);
    setSubmissionId(null);
    setSubmittedRequest(null);
  }

  return (
    <DraftContext.Provider value={{ hospitalForm, preparedDraft, submissionId, submittedRequest,
      setSubmissionId, completeSubmission: setSubmittedRequest, updateHospital,
      prepareDraft: setPreparedDraft, clearPreparedDraft: () => setPreparedDraft(null), resetDraft }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useEmergencyRequestDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useEmergencyRequestDraft must be used inside EmergencyRequestDraftProvider.');
  return context;
}
