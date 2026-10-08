import { collection, doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import type { EmergencyRequestDraft, RequestStatusDetails, SubmittedRequestReceipt, UpdateRequestForm } from '../types/emergencyRequest';
import { buildRequestRecord, buildSubmissionReceipt } from '../utils/submissionData';
import { validateHospitalDetails } from '../utils/hospitalValidation';
import { canUpdateRequest } from '../utils/requestStatus';

const REQUESTS_COLLECTION = 'emergencyRequests';

export function createEmergencyRequestId() {
  return doc(collection(db, REQUESTS_COLLECTION)).id;
}

export async function submitEmergencyRequest(
  draft: EmergencyRequestDraft, requesterId: string, requestId: string,
): Promise<SubmittedRequestReceipt> {
  if (auth.currentUser?.uid !== requesterId) throw new Error('Your session has changed. Please sign in again.');
  const requestRef = doc(db, REQUESTS_COLLECTION, requestId);

  return runTransaction(db, async transaction => {
    const existing = await transaction.get(requestRef);
    if (auth.currentUser?.uid !== requesterId) throw new Error('Your session has changed. Please sign in again.');

    if (existing.exists()) {
      const saved = existing.data();
      if (saved.requesterId !== requesterId) throw new Error('This request ID is unavailable. Please start a new request.');
      // Retry the same ID without overwriting or duplicating an already saved request.
      return buildSubmissionReceipt(requestId, saved as ReturnType<typeof buildRequestRecord>);
    }

    const record = buildRequestRecord(draft, requesterId);
    transaction.set(requestRef, { ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return buildSubmissionReceipt(requestId, record);
  });
}

export function getSubmissionErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === 'permission-denied') return 'Your account does not have permission to submit requests. Please contact the project administrator.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Unable to confirm the save. Check your connection and retry; the same request ID will be reused.';
  return error instanceof Error ? error.message : 'Unable to submit the request. Please try again.';
}

export function watchEmergencyRequest(
  requestId: string, requesterId: string,
  onChange: (request: RequestStatusDetails | null, fromCache: boolean, hasPendingWrites: boolean) => void,
  onError: (error: unknown) => void,
) {
  if (!requestId || auth.currentUser?.uid !== requesterId) {
    onError(new Error('Please sign in again to view this request.'));
    return () => {};
  }
  return onSnapshot(doc(db, REQUESTS_COLLECTION, requestId), { includeMetadataChanges: true }, snapshot => {
    try {
      if (auth.currentUser?.uid !== requesterId) throw new Error('Your session has changed. Please sign in again.');
      if (!snapshot.exists()) {
        onChange(null, snapshot.metadata.fromCache, snapshot.metadata.hasPendingWrites);
        return;
      }
      const data = snapshot.data();
      if (data.requesterId !== requesterId) throw new Error('This request does not belong to your account.');
      const receipt = buildSubmissionReceipt(requestId, data as ReturnType<typeof buildRequestRecord>);
      onChange({ ...receipt, verified: data.verified === true || data.isVerified === true,
        location: typeof data.location === 'string' ? data.location : '' },
      snapshot.metadata.fromCache, snapshot.metadata.hasPendingWrites);
    } catch (error) { onError(error); }
  }, onError);
}

export function getRequestStatusErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === 'permission-denied') return 'You do not have permission to view this request. Please contact the project administrator.';
  if (code === 'unavailable') return 'Unable to connect. Please check your connection and retry.';
  return error instanceof Error ? error.message : 'Unable to load the request status. Please retry.';
}

export async function getRequestForUpdate(requestId: string, requesterId: string): Promise<RequestStatusDetails> {
  if (!requestId || auth.currentUser?.uid !== requesterId) throw new Error('Please sign in again to view this request.');
  const snapshot = await getDocFromServer(doc(db, REQUESTS_COLLECTION, requestId));
  if (auth.currentUser?.uid !== requesterId) throw new Error('Your session has changed. Please sign in again.');
  if (!snapshot.exists()) throw new Error('This request could not be found.');
  const data = snapshot.data();
  if (data.requesterId !== requesterId) throw new Error('This request does not belong to your account.');
  return { ...buildSubmissionReceipt(requestId, data as ReturnType<typeof buildRequestRecord>),
    verified: data.verified === true || data.isVerified === true, location: typeof data.location === 'string' ? data.location : '' };
}

export async function updateEmergencyRequest(
  requestId: string, requesterId: string, form: UpdateRequestForm, baseline: RequestStatusDetails,
) {
  if (auth.currentUser?.uid !== requesterId) throw new Error('Your session has changed. Please sign in again.');
  if (requestId !== baseline.requestId) throw new Error('The request ID does not match the loaded request.');
  const result = validateHospitalDetails({ ...form, bloodGroup: baseline.bloodGroup });
  if (!result.valid) throw new Error(Object.values(result.errors)[0] ?? 'Please check the request details.');
  const { hospital, bloodRequirement, requiredDate, urgencyLevel } = result.details;
  const urgency = { Normal: 'normal', Urgent: 'urgent', Critical: 'critical' } as const;
  const requestRef = doc(db, REQUESTS_COLLECTION, requestId);

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(requestRef);
    if (auth.currentUser?.uid !== requesterId) throw new Error('Your session has changed. Please sign in again.');
    if (!snapshot.exists()) throw new Error('This request could not be found.');
    const data = snapshot.data();
    if (data.requesterId !== requesterId) throw new Error('This request does not belong to your account.');
    const current = buildSubmissionReceipt(requestId, data as ReturnType<typeof buildRequestRecord>);
    if (!canUpdateRequest(current.status, data.verified === true || data.isVerified === true)) {
      throw new Error('This request is no longer awaiting verification and cannot be edited. Return to Status to view its progress.');
    }
    if (current.bloodGroup !== baseline.bloodGroup || current.unitsRequired !== baseline.unitsRequired
      || current.hospitalName !== baseline.hospitalName || (data.location ?? '') !== baseline.location
      || current.requiredDate !== baseline.requiredDate || current.urgencyLevel !== baseline.urgencyLevel) {
      throw new Error('The saved details have changed since you opened this form. Reload the latest details before saving.');
    }
    transaction.update(requestRef, {
      unitsRequired: bloodRequirement.unitsRequired, hospitalName: hospital.hospitalName,
      location: hospital.hospitalLocation, requiredDate, urgency: urgency[urgencyLevel], updatedAt: serverTimestamp(),
    });
  });
}

export function getRequestUpdateErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === 'permission-denied') return 'You do not have permission to update this request. Please contact the project administrator.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Unable to confirm the update. Check your connection, then reload the saved details before retrying.';
  return error instanceof Error ? error.message : 'Unable to update the request. Please retry.';
}
