import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  db,
} from '../../../config/firebase';

import type {
  BloodGroup,
  DonorProfile,
  EmergencyRequest,
  RequestUrgency,
} from '../../donor/types/donor';
import { getDonorProfiles } from '../../donor/services/donorService';

const EMERGENCY_REQUESTS = 'emergencyRequests';
const DONOR_RESPONSES = 'donorResponses';

const CLOSED_STATUSES = new Set([
  'completed',
  'cancelled',
  'closed',
  'rejected',
]);

const BLOOD_GROUPS: BloodGroup[] = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
];

export interface VerificationDashboardSummary {
  totalRequests: number;
  pendingRequests: number;
  verifiedRequests: number;
  matchedDonors: number | null;
  urgentRequests: number;
  recentRequests: EmergencyRequest[];
}

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function asUrgency(value: unknown): RequestUrgency {
  const urgency = asText(value).toLowerCase();

  if (urgency === 'critical' || urgency === 'urgent') {
    return urgency;
  }

  return 'normal';
}

function asBloodGroup(value: unknown): BloodGroup {
  const bloodGroup = asText(value).toUpperCase() as BloodGroup;
  return BLOOD_GROUPS.includes(bloodGroup) ? bloodGroup : 'O+';
}

function normalizeRequest(
  id: string,
  data: Record<string, unknown>,
): EmergencyRequest {
  const status = asText(data.status, 'open').toLowerCase();

  return {
    id,
    patientName: asText(data.patientName ?? data.patient ?? data.name, 'Patient'),
    bloodGroup: asBloodGroup(data.bloodGroup ?? data.requiredBloodGroup),
    hospitalName: asText(data.hospitalName ?? data.hospital, 'Hospital'),
    location: asText(
      data.location ?? data.hospitalLocation ?? data.address,
      'Location unavailable',
    ),
    unitsRequired: Number(data.unitsRequired ?? data.units ?? data.quantity ?? 1),
    requiredDate: asText(
      data.requiredDate ?? data.dateNeeded ?? data.date,
      'Not specified',
    ),
    urgency: asUrgency(data.urgency ?? data.priority),
    notes: asText(data.notes ?? data.additionalNotes),
    contactName: asText(data.contactName ?? data.requesterName),
    contactPhone: asText(data.contactPhone ?? data.phone),
    status,
    verified:
      data.verified === true ||
      data.isVerified === true ||
      status === 'verified',
    createdAt: (data.createdAt ?? null) as EmergencyRequest['createdAt'],
  };
}

function requestTime(request: EmergencyRequest): number {
  const createdAt = request.createdAt as
    | { toMillis?: () => number }
    | string
    | null
    | undefined;

  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return createdAt?.toMillis?.() ?? 0;
}

export async function getVerificationDashboardSummary(): Promise<VerificationDashboardSummary> {
  const [requestSnapshot, responseSnapshot] = await Promise.all([
    getDocs(collection(db, EMERGENCY_REQUESTS)),
    getDocs(query(
      collection(db, DONOR_RESPONSES),
      where('status', 'in', ['accepted', 'completed']),
    )).catch(error => {
      console.warn('Matched donor count unavailable:', error);
      return null;
    }),
  ]);

  const activeRequests = requestSnapshot.docs
    .map(document => normalizeRequest(
      document.id,
      document.data() as Record<string, unknown>,
    ))
    .filter(request => !CLOSED_STATUSES.has(request.status));

  const recentRequests = [...activeRequests]
    .sort((a, b) => requestTime(b) - requestTime(a))
    .slice(0, 3);

  const verifiedRequestIds = new Set(
    activeRequests
      .filter(request => request.verified)
      .map(request => request.id),
  );

  const matchedDonors = responseSnapshot
    ? new Set(
    responseSnapshot.docs
      .map(document => document.data())
      .filter(response =>
        typeof response.donorId === 'string' &&
        typeof response.requestId === 'string' &&
        verifiedRequestIds.has(response.requestId),
      )
      .map(response => response.donorId as string),
    )
    : null;

  return {
    totalRequests: activeRequests.length,
    pendingRequests: activeRequests.filter(request => !request.verified).length,
    verifiedRequests: activeRequests.filter(request => request.verified).length,
    matchedDonors: matchedDonors?.size ?? null,
    urgentRequests: activeRequests.filter(
      request => request.urgency === 'critical' || request.urgency === 'urgent',
    ).length,
    recentRequests,
  };
}

export async function getPendingVerificationRequests(): Promise<EmergencyRequest[]> {
  const snapshot = await getDocs(collection(db, EMERGENCY_REQUESTS));

  const urgencyRank: Record<RequestUrgency, number> = {
    critical: 3,
    urgent: 2,
    normal: 1,
  };

  return snapshot.docs
    .map(document => normalizeRequest(
      document.id,
      document.data() as Record<string, unknown>,
    ))
    .filter(request =>
      !request.verified && !CLOSED_STATUSES.has(request.status),
    )
    .sort((a, b) =>
      urgencyRank[b.urgency] - urgencyRank[a.urgency] ||
      requestTime(b) - requestTime(a),
    );
}

export async function getVerificationRequestById(
  requestId: string,
): Promise<EmergencyRequest | null> {
  const snapshot = await getDoc(
    doc(db, EMERGENCY_REQUESTS, requestId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeRequest(
    snapshot.id,
    snapshot.data() as Record<string, unknown>,
  );
}

export async function verifyRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, EMERGENCY_REQUESTS, requestId), {
    verified: true,
    status: 'verified',
    updatedAt: serverTimestamp(),
  });
}

export async function getMatchingDonors(
  bloodGroup: BloodGroup,
): Promise<DonorProfile[]> {
  const donors = await getDonorProfiles();
  return donors.filter(
    donor => donor.bloodGroup === bloodGroup && donor.isAvailable,
  );
}
