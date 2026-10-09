import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  db,
} from '../../../config/firebase';

import type {
  BloodGroup,
  DonorProfile,
  DonorResponse,
  DonorResponseChoice,
  EmergencyRequest,
  RequestUrgency,
  SaveDonorProfileInput,
} from '../types/donor';

const DONOR_PROFILES =
  'donorProfiles';

const EMERGENCY_REQUESTS =
  'emergencyRequests';

const DONOR_RESPONSES =
  'donorResponses';

/*
 * Blood compatibility for red-cell donation.
 *
 * Key = donor blood group.
 * Values = blood groups that donor can donate to.
 */
const COMPATIBILITY: Record<
  BloodGroup,
  BloodGroup[]
> = {
  'O-': [
    'O-',
    'O+',
    'A-',
    'A+',
    'B-',
    'B+',
    'AB-',
    'AB+',
  ],

  'O+': [
    'O+',
    'A+',
    'B+',
    'AB+',
  ],

  'A-': [
    'A-',
    'A+',
    'AB-',
    'AB+',
  ],

  'A+': [
    'A+',
    'AB+',
  ],

  'B-': [
    'B-',
    'B+',
    'AB-',
    'AB+',
  ],

  'B+': [
    'B+',
    'AB+',
  ],

  'AB-': [
    'AB-',
    'AB+',
  ],

  'AB+': [
    'AB+',
  ],
};

/*
 * Convert Firestore blood group value
 * to our BloodGroup type.
 */
function normalizeBloodGroup(
  value: unknown,
): BloodGroup {
  const valid: BloodGroup[] = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  const normalized =
    String(value ?? '')
      .trim()
      .toUpperCase() as BloodGroup;

  if (
    valid.includes(
      normalized,
    )
  ) {
    return normalized;
  }

  return 'O+';
}

/*
 * Normalize urgency values coming
 * from different team modules.
 *
 * Supported values:
 *
 * critical / emergency -> critical
 * urgent / high        -> urgent
 * normal / others      -> normal
 */
function normalizeUrgency(
  value: unknown,
): RequestUrgency {
  const urgency =
    String(value ?? '')
      .trim()
      .toLowerCase();

  if (
    urgency === 'critical' ||
    urgency === 'emergency'
  ) {
    return 'critical';
  }

  if (
    urgency === 'urgent' ||
    urgency === 'high'
  ) {
    return 'urgent';
  }

  return 'normal';
}

/*
 * Convert a Firestore emergency request
 * document into the format expected by
 * the donor screens.
 *
 * Multiple alternative field names are
 * supported to make integration with
 * other team modules easier.
 */
function normalizeRequest(
  id: string,
  data: Record<string, any>,
): EmergencyRequest {
  const status =
    String(
      data.status ??
        'open',
    )
      .trim()
      .toLowerCase();

  const verified =
    data.verified === true ||
    data.isVerified === true ||
    status === 'verified';

  return {
    id,

    patientName:
      data.patientName ??
      data.patient ??
      data.name ??
      'Patient',

    bloodGroup:
      normalizeBloodGroup(
        data.bloodGroup ??
          data.requiredBloodGroup,
      ),

    hospitalName:
      data.hospitalName ??
      data.hospital ??
      'Hospital',

    location:
      data.location ??
      data.Location ??
      data.hospitalLocation ??
      data.address ??
      'Location unavailable',

    unitsRequired:
      Number(
        data.unitsRequired ??
          data.units ??
          data.quantity ??
          1,
      ),

    requiredDate:
      data.requiredDate ??
      data.dateNeeded ??
      data.date ??
      'Not specified',

    urgency:
      normalizeUrgency(
        data.urgency ??
          data.priority,
      ),

    notes:
      data.notes ??
      data.additionalNotes ??
      '',

    contactName:
      data.contactName ??
      data.requesterName ??
      '',

    contactPhone:
      data.contactPhone ??
      data.phone ??
      '',

    status,

    verified,

    createdAt:
      data.createdAt ??
      null,
  };
}

/*
 * ========================================
 * DONOR PROFILE
 * ========================================
 */

export async function getDonorProfile(
  userId: string,
): Promise<DonorProfile> {
  const donorRef =
    doc(
      db,
      DONOR_PROFILES,
      userId,
    );

  const donorSnap =
    await getDoc(
      donorRef,
    );

  /*
   * If a donor profile already exists,
   * return donor-specific information.
   */
  if (
    donorSnap.exists()
  ) {
    const data =
      donorSnap.data();

    return {
      userId,

      fullName:
        data.fullName ??
        '',

      email:
        data.email ??
        '',

      phone:
        data.phone ??
        '',

      age:
        data.age !== undefined &&
        data.age !== null
          ? Number(
              data.age,
            )
          : undefined,

      bloodGroup:
        data.bloodGroup
          ? normalizeBloodGroup(
              data.bloodGroup,
            )
          : undefined,

      district:
        data.district ??
        '',

      city:
        data.city ??
        '',

      address:
        data.address ??
        '',

      isAvailable:
        data.isAvailable ??
        true,

      lastDonationDate:
        data.lastDonationDate ??
        '',

      profileCompleted:
        data.profileCompleted ??
        false,

      createdAt:
        data.createdAt ??
        null,

      updatedAt:
        data.updatedAt ??
        null,
    };
  }

  /*
   * Donor profile has not yet been created.
   * Read basic registration information
   * from users/{uid}.
   */
  const userRef =
    doc(
      db,
      'users',
      userId,
    );

  const userSnap =
    await getDoc(
      userRef,
    );

  const userData =
    userSnap.exists()
      ? userSnap.data()
      : {};

  return {
    userId,

    fullName:
      userData.fullName ??
      userData.name ??
      '',

    email:
      userData.email ??
      '',

    phone:
      userData.phone ??
      '',

    isAvailable:
      true,

    profileCompleted:
      false,
  };
}

export async function saveDonorProfile(
  userId: string,
  input: SaveDonorProfileInput,
): Promise<void> {
  const profileRef =
    doc(
      db,
      DONOR_PROFILES,
      userId,
    );

  const existing =
    await getDoc(
      profileRef,
    );

  const payload: Record<
    string,
    any
  > = {
    userId,

    fullName:
      input.fullName.trim(),

    email:
      input.email.trim(),

    phone:
      input.phone.trim(),

    age:
      input.age,

    bloodGroup:
      input.bloodGroup,

    district:
      input.district.trim(),

    city:
      input.city.trim(),

    address:
      input.address.trim(),

    isAvailable:
      input.isAvailable,

    lastDonationDate:
      input.lastDonationDate ??
      '',

    profileCompleted:
      true,

    updatedAt:
      serverTimestamp(),
  };

  /*
   * Only add createdAt when creating
   * the donor profile for the first time.
   */
  if (
    !existing.exists()
  ) {
    payload.createdAt =
      serverTimestamp();
  }

  await setDoc(
    profileRef,
    payload,
    {
      merge: true,
    },
  );
}

export async function updateDonorAvailability(
  userId: string,
  isAvailable: boolean,
): Promise<void> {
  await setDoc(
    doc(
      db,
      DONOR_PROFILES,
      userId,
    ),
    {
      userId,

      isAvailable,

      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

/*
 * ========================================
 * EMERGENCY REQUESTS
 * ========================================
 */

export async function getCompatibleRequests(
  donorBloodGroup?: BloodGroup,
): Promise<
  EmergencyRequest[]
> {
  if (
    !donorBloodGroup
  ) {
    return [];
  }

  const snapshot =
    await getDocs(
      collection(
        db,
        EMERGENCY_REQUESTS,
      ),
    );

  const compatible =
    COMPATIBILITY[
      donorBloodGroup
    ];

  const requests =
    snapshot.docs
      .map(item =>
        normalizeRequest(
          item.id,
          item.data(),
        ),
      )
      .filter(
        request => {
          /*
           * Requests that are no longer active
           * should not be shown to donors.
           */
          const active =
            ![
              'completed',
              'cancelled',
              'closed',
              'rejected',
            ].includes(
              request.status,
            );

          return (
            request.verified &&
            active &&
            compatible.includes(
              request.bloodGroup,
            )
          );
        },
      );

  /*
   * Critical first,
   * urgent second,
   * normal last.
   */
  return requests.sort(
    (a, b) => {
      const rank: Record<
        RequestUrgency,
        number
      > = {
        critical: 3,
        urgent: 2,
        normal: 1,
      };

      return (
        rank[b.urgency] -
        rank[a.urgency]
      );
    },
  );
}

export async function getEmergencyRequestById(
  requestId: string,
): Promise<
  EmergencyRequest | null
> {
  const requestRef =
    doc(
      db,
      EMERGENCY_REQUESTS,
      requestId,
    );

  const snapshot =
    await getDoc(
      requestRef,
    );

  if (
    !snapshot.exists()
  ) {
    return null;
  }

  return normalizeRequest(
    snapshot.id,
    snapshot.data(),
  );
}

/*
 * ========================================
 * DONOR RESPONSES
 * ========================================
 */

export async function saveDonorResponse(
  donorId: string,
  request: EmergencyRequest,
  response: DonorResponseChoice,
): Promise<string> {
  /*
   * Deterministic document ID prevents
   * duplicate responses from the same
   * donor for the same request.
   *
   * Example:
   *
   * request123_user456
   */
  const responseId =
    `${request.id}_${donorId}`;

  const responseRef =
    doc(
      db,
      DONOR_RESPONSES,
      responseId,
    );

  /*
   * Check whether donor already responded.
   */
  const existing =
    await getDoc(
      responseRef,
    );

  const payload: Record<
    string,
    any
  > = {
    donorId,

    requestId:
      request.id,

    response,

    status:
      response,

    requestSnapshot: {
      patientName:
        request.patientName,

      bloodGroup:
        request.bloodGroup,

      hospitalName:
        request.hospitalName,

      location:
        request.location,

      urgency:
        request.urgency,

      unitsRequired:
        request.unitsRequired,

      requiredDate:
        request.requiredDate,
    },

    updatedAt:
      serverTimestamp(),
  };

  /*
   * createdAt only gets created
   * for the first response.
   */
  if (
    !existing.exists()
  ) {
    payload.createdAt =
      serverTimestamp();
  }

  await setDoc(
    responseRef,
    payload,
    {
      merge: true,
    },
  );

  return responseId;
}

/*
 * Read only the currently logged-in
 * donor's responses.
 */
export async function getDonorResponses(
  donorId: string,
): Promise<
  DonorResponse[]
> {
  const donorResponsesQuery =
    query(
      collection(
        db,
        DONOR_RESPONSES,
      ),

      where(
        'donorId',
        '==',
        donorId,
      ),
    );

  const snapshot =
    await getDocs(
      donorResponsesQuery,
    );

  const responses =
    snapshot.docs.map(
      item => {
        const data =
          item.data();

        return {
          id:
            item.id,

          donorId:
            data.donorId,

          requestId:
            data.requestId,

          response:
            data.response,

          status:
            data.status,

          requestSnapshot:
            data.requestSnapshot,

          createdAt:
            data.createdAt ??
            null,

          updatedAt:
            data.updatedAt ??
            null,
        } as DonorResponse;
      },
    );

  /*
   * Newest response first.
   */
  return responses.sort(
    (a, b) => {
      const aTime =
        a.createdAt
          ?.toMillis?.() ??
        0;

      const bTime =
        b.createdAt
          ?.toMillis?.() ??
        0;

      return (
        bTime -
        aTime
      );
    },
  );
}

/*
 * Check whether a donor has already
 * responded to one particular request.
 */
export async function getDonorResponseForRequest(
  donorId: string,
  requestId: string,
): Promise<
  DonorResponse | null
> {
  const responseId =
    `${requestId}_${donorId}`;

  const responseRef =
    doc(
      db,
      DONOR_RESPONSES,
      responseId,
    );

  const snapshot =
    await getDoc(
      responseRef,
    );

  if (
    !snapshot.exists()
  ) {
    return null;
  }

  const data =
    snapshot.data();

  return {
    id:
      snapshot.id,

    donorId:
      data.donorId,

    requestId:
      data.requestId,

    response:
      data.response,

    status:
      data.status,

    requestSnapshot:
      data.requestSnapshot,

    createdAt:
      data.createdAt ??
      null,

    updatedAt:
      data.updatedAt ??
      null,
  };
}

/*
 * ========================================
 * UPDATE RESPONSE
 * ========================================
 *
 * Accepted response can be withdrawn.
 */
export async function withdrawDonorResponse(
  responseId: string,
): Promise<void> {
  await updateDoc(
    doc(
      db,
      DONOR_RESPONSES,
      responseId,
    ),
    {
      status:
        'withdrawn',

      updatedAt:
        serverTimestamp(),
    },
  );
}

/*
 * ========================================
 * DELETE RESPONSE
 * ========================================
 *
 * Used only for declined or withdrawn
 * records from Donation History.
 */
export async function deleteDonorResponse(
  responseId: string,
): Promise<void> {
  await deleteDoc(
    doc(
      db,
      DONOR_RESPONSES,
      responseId,
    ),
  );
}