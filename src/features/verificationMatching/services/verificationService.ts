import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
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
const DONOR_PROFILES = 'donorProfiles';
const DONOR_MATCHES = 'donorMatches';

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

export interface MatchingHistoryRecord {
  id: string;
  requestId: string;
  donorId: string;
  patientName: string;
  donorName: string;
  bloodGroup: string;
  unitsRequired?: number;
  status: string;
  createdAt: unknown;
  updatedAt: unknown;
}

function logMatchingHistoryReadFailure(operation: string, error: unknown): void {
  const details = error && typeof error === 'object'
    ? error as { code?: unknown; message?: unknown }
    : null;
  console.error(`[MatchingHistory] Firestore read failed: ${operation}`, {
    code: typeof details?.code === 'string' ? details.code : 'unknown',
    message: typeof details?.message === 'string' ? details.message : String(error),
    error,
  });
}

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function asUrgency(value: unknown): RequestUrgency {
  const urgency = asText(value).toLowerCase();

  if (urgency === 'critical') {
    return 'critical';
  }

  if (urgency === 'urgent' || urgency === 'high') {
    return 'urgent';
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

/** Persist confirmed matches atomically and idempotently. */
export async function confirmDonorMatches(
  requestId: string,
  donorIds: string[],
): Promise<void> {
  const uniqueDonorIds = [...new Set(donorIds.filter(Boolean))];
  if (!requestId || uniqueDonorIds.length === 0) {
    throw new Error('A request and at least one donor are required to confirm a match.');
  }

  const matchRefs = uniqueDonorIds.map(donorId => ({
    donorId,
    ref: doc(db, DONOR_MATCHES, `${requestId}_${donorId}`),
  }));

  await runTransaction(db, async transaction => {
    const existingMatches = await Promise.all(
      matchRefs.map(match => transaction.get(match.ref)),
    );

    existingMatches.forEach((snapshot, index) => {
      if (snapshot.exists()) return;

      const { donorId, ref } = matchRefs[index];
      transaction.set(ref, {
        requestId,
        donorId,
        status: 'matched',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  });
}

/** Build history from persisted healthcare-confirmed donor matches. */
export async function getMatchingHistory(): Promise<MatchingHistoryRecord[]> {
  let matchSnapshot;
  try {
    matchSnapshot = await getDocs(collection(db, DONOR_MATCHES));
  } catch (error) {
    logMatchingHistoryReadFailure(
      `getDocs(collection(db, '${DONOR_MATCHES}'))`,
      error,
    );
    throw error;
  }
  const matches = matchSnapshot.docs
    .map(document => ({ id: document.id, data: document.data() }))
    .filter(item =>
      typeof item.data.requestId === 'string' &&
      typeof item.data.donorId === 'string',
    );

  const requestIds = [...new Set(matches.map(item => item.data.requestId as string))];
  const donorIds = [...new Set(matches.map(item => item.data.donorId as string))];

  const [requestEntries, donorEntries] = await Promise.all([
    Promise.all(requestIds.map(async id => {
      try {
        const snapshot = await getDoc(doc(db, EMERGENCY_REQUESTS, id));
        return [id, snapshot.exists() ? snapshot.data() : null] as const;
      } catch (error) {
        logMatchingHistoryReadFailure(`getDoc(doc(db, '${EMERGENCY_REQUESTS}', '${id}'))`, error);
        throw error;
      }
    })),
    Promise.all(donorIds.map(async id => {
      try {
        const snapshot = await getDoc(doc(db, DONOR_PROFILES, id));
        return [id, snapshot.exists() ? snapshot.data() : null] as const;
      } catch (error) {
        logMatchingHistoryReadFailure(`getDoc(doc(db, '${DONOR_PROFILES}', '${id}'))`, error);
        throw error;
      }
    })),
  ]);

  const requestsById = new Map(requestEntries);
  const donorsById = new Map(donorEntries);

  return matches.map(({ id, data }) => {
    const requestId = data.requestId as string;
    const donorId = data.donorId as string;
    const request = requestsById.get(requestId);
    const snapshot = data.requestSnapshot && typeof data.requestSnapshot === 'object'
      ? data.requestSnapshot as Record<string, unknown>
      : {};
    const patientName = request?.patientName ?? request?.patient ?? request?.name ?? snapshot.patientName;
    const donorName = donorsById.get(donorId)?.fullName;
    const rawUnits = request?.unitsRequired ?? request?.units ?? request?.quantity ?? snapshot.unitsRequired;
    const unitsRequired = typeof rawUnits === 'number' && Number.isFinite(rawUnits)
      ? rawUnits
      : typeof rawUnits === 'string' && rawUnits.trim() && Number.isFinite(Number(rawUnits))
        ? Number(rawUnits)
        : undefined;

    return {
      id,
      requestId,
      donorId,
      patientName: typeof patientName === 'string' && patientName.trim()
        ? patientName.trim()
        : 'Patient name unavailable',
      donorName: typeof donorName === 'string' && donorName.trim()
        ? donorName.trim()
        : 'Donor name unavailable',
      bloodGroup: String(
        request?.bloodGroup ?? request?.requiredBloodGroup ?? snapshot.bloodGroup ?? '—',
      ),
      unitsRequired,
      status: String(data.status ?? 'unknown').trim().toLowerCase(),
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? data.createdAt ?? null,
    };
  });
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
