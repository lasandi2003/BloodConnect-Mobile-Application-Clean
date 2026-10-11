import { collection, doc, getDocFromServer, getDocsFromServer, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import type { ApprovalStatus } from '../../../types/auth';
import { getApprovalStatus, requiresAdminApproval } from '../utils/roleApproval';

export type StaffRole = 'healthcare' | 'bloodBank';
export interface StaffApplication {
  uid: string; fullName: string; email: string; role: StaffRole;
  institutionName: string; designation: string; employeeId: string;
  registeredAt: number | null; approvalStatus: ApprovalStatus; legacy: boolean;
}
export interface StaffAccessState {
  approvalStatus: ApprovalStatus; fromCache: boolean; roleMatches: boolean; suspended: boolean;
}

function checkSession(uid: string) {
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Your session changed. Please sign in again.');
}

export function watchStaffAccess(uid: string, role: StaffRole, onChange: (state: StaffAccessState) => void, onError: (error: unknown) => void) {
  try { checkSession(uid); } catch (error) { onError(error); return () => {}; }
  return onSnapshot(doc(db, 'users', uid), { includeMetadataChanges: true }, snapshot => {
    try {
      checkSession(uid);
      if (!snapshot.exists()) throw new Error('Your account profile could not be found. Please contact the administrator.');
      const data = snapshot.data();
      onChange({ approvalStatus: getApprovalStatus(data.approvalStatus), fromCache: snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites,
        roleMatches: data.role === role, suspended: data.status !== undefined && data.status !== 'active' });
    } catch (error) { onError(error); }
  }, onError);
}

async function checkAdmin(uid: string) {
  checkSession(uid);
  const snapshot = await getDocFromServer(doc(db, 'users', uid));
  checkSession(uid);
  if (!snapshot.exists() || snapshot.data().role !== 'admin' || snapshot.data().status === 'suspended') {
    throw new Error('Only an active administrator can review staff applications.');
  }
}

export async function loadPendingApplications(adminUid: string): Promise<StaffApplication[]> {
  await checkAdmin(adminUid);
  // Query roles, then select pending/legacy applications without a composite index.
  const snapshot = await getDocsFromServer(query(collection(db, 'users'), where('role', 'in', ['healthcare', 'bloodBank'])));
  checkSession(adminUid);
  const value = (field: unknown) => typeof field === 'string' && field.trim() ? field.trim() : 'Not recorded';
  const applications: StaffApplication[] = [];
  for (const document of snapshot.docs) {
    const data = document.data();
    if (data.role !== 'healthcare' && data.role !== 'bloodBank') continue;
    if (getApprovalStatus(data.approvalStatus) !== 'pending') continue;
    const date = typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : null;
    applications.push({ uid: document.id, fullName: value(data.fullName), email: value(data.email), role: data.role,
      institutionName: value(data.institutionName), designation: value(data.designation), employeeId: value(data.employeeId),
      registeredAt: typeof date === 'number' && Number.isFinite(date) ? date : null,
      approvalStatus: 'pending', legacy: data.approvalStatus === undefined });
  }
  return applications.sort((a, b) => (a.registeredAt ?? 0) - (b.registeredAt ?? 0) || a.uid.localeCompare(b.uid));
}

export async function reviewStaffApplication(adminUid: string, applicantUid: string, expectedRole: StaffRole, decision: 'approved' | 'rejected') {
  checkSession(adminUid);
  if (adminUid === applicantUid) throw new Error('You cannot review your own application.');
  if (!applicantUid || !requiresAdminApproval(expectedRole) || !['approved', 'rejected'].includes(decision)) throw new Error('Invalid staff application review.');
  await runTransaction(db, async transaction => {
    const admin = await transaction.get(doc(db, 'users', adminUid));
    const applicantRef = doc(db, 'users', applicantUid);
    const applicant = await transaction.get(applicantRef);
    checkSession(adminUid);
    if (!admin.exists() || admin.data().role !== 'admin' || admin.data().status === 'suspended') throw new Error('Only an active administrator can review applications.');
    if (!applicant.exists()) throw new Error('This application no longer exists. Refresh the list.');
    const data = applicant.data();
    if (data.role !== expectedRole) throw new Error('The requested role changed. Refresh and review the application again.');
    if (data.approvalStatus === decision && data[decision === 'approved' ? 'approvedBy' : 'rejectedBy'] === adminUid) return;
    if (data.approvalStatus !== undefined && data.approvalStatus !== 'pending') throw new Error('This application has already been reviewed. Refresh the list.');
    transaction.update(applicantRef, {
      approvalStatus: decision, updatedAt: serverTimestamp(),
      ...(decision === 'approved' ? { approvedAt: serverTimestamp(), approvedBy: adminUid }
        : { rejectedAt: serverTimestamp(), rejectedBy: adminUid }),
    });
  });
}

export function getApprovalErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === 'permission-denied') return 'Approval access was denied. Check your admin account and publish the reviewed approval security rules.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Unable to confirm this operation. Check your connection, then refresh the application status before retrying.';
  return error instanceof Error ? error.message : 'Unable to load or review applications. Please retry.';
}
