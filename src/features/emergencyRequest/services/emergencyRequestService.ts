import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import type { EmergencyRequestDraft, SubmittedRequestReceipt } from '../types/emergencyRequest';
import { buildRequestRecord, buildSubmissionReceipt } from '../utils/submissionData';

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
