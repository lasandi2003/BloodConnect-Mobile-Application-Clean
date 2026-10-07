import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { EmergencyRequestDraft, HospitalDetailsForm } from '../types/emergencyRequest';

const emptyHospitalForm: HospitalDetailsForm = {
  bloodGroup: '', unitsRequired: '', hospitalName: '', hospitalLocation: '', requiredDate: '', urgencyLevel: '',
};

interface DraftContextValue {
  hospitalForm: HospitalDetailsForm;
  preparedDraft: EmergencyRequestDraft | null;
  updateHospital: (values: Partial<HospitalDetailsForm>) => void;
  prepareDraft: (draft: EmergencyRequestDraft) => void;
  clearPreparedDraft: () => void;
  resetDraft: () => void;
}

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

export function EmergencyRequestDraftProvider({ children }: { children: ReactNode }) {
  const [hospitalForm, setHospitalForm] = useState<HospitalDetailsForm>(emptyHospitalForm);
  const [preparedDraft, setPreparedDraft] = useState<EmergencyRequestDraft | null>(null);

  function updateHospital(values: Partial<HospitalDetailsForm>) {
    setHospitalForm(previous => ({ ...previous, ...values }));
    setPreparedDraft(null);
  }

  function resetDraft() {
    setHospitalForm({ ...emptyHospitalForm });
    setPreparedDraft(null);
  }

  return (
    <DraftContext.Provider value={{ hospitalForm, preparedDraft, updateHospital,
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
