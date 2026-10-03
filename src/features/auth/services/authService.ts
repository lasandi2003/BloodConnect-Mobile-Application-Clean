import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
} from '../../../config/firebase';

import type {
  RegisterInput,
  UserProfile,
  UserRole,
} from '../../../types/auth';

const USERS_COLLECTION = 'users';

const validRoles: UserRole[] = [
  'donor',
  'requester',
  'healthcare',
  'bloodBank',
  'admin',
];

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const userRef = doc(
    db,
    USERS_COLLECTION,
    uid,
  );

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  const role = data.role as UserRole;

  if (!validRoles.includes(role)) {
    throw new Error(
      'This account has an invalid user role.',
    );
  }

  return {
    uid,

    fullName:
      data.fullName ??
      data.name ??
      'BloodConnect User',

    email:
      data.email ?? '',

    phone:
      data.phone ?? '',

    role,

    healthcareType:
      data.healthcareType,

    status:
      data.status ?? 'active',
  };
}

export async function registerAccount(
  input: RegisterInput,
): Promise<UserProfile> {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password,
    );

  try {
    await updateProfile(
      credential.user,
      {
        displayName:
          input.fullName.trim(),
      },
    );

    const profile: UserProfile = {
      uid: credential.user.uid,
      fullName:
        input.fullName.trim(),
      email:
        input.email
          .trim()
          .toLowerCase(),
      phone:
        input.phone.trim(),
      role:
        input.role,
      status:
        'active',

      ...(input.healthcareType
        ? {
            healthcareType:
              input.healthcareType,
          }
        : {}),
    };

    const firestoreProfile: Record<
      string,
      unknown
    > = {
      ...profile,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    };

    await setDoc(
      doc(
        db,
        USERS_COLLECTION,
        credential.user.uid,
      ),
      firestoreProfile,
    );

    return profile;
  } catch (error) {
    try {
      await deleteUser(
        credential.user,
      );
    } catch {
      // Ignore cleanup error.
    }

    throw error;
  }
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<UserProfile> {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

  const profile =
    await getUserProfile(
      credential.user.uid,
    );

  if (!profile) {
    await signOut(auth);

    throw new Error(
      'No BloodConnect profile was found for this account.',
    );
  }

  if (
    profile.status ===
    'suspended'
  ) {
    await signOut(auth);

    throw new Error(
      'This account has been suspended.',
    );
  }

  return profile;
}

export async function logoutAccount() {
  await signOut(auth);
}

export async function resetAccountPassword(
  email: string,
) {
  await sendPasswordResetEmail(
    auth,
    email.trim(),
  );
}

export function getAuthErrorMessage(
  error: unknown,
): string {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error
  ) {
    const code = String(
      (
        error as {
          code?: string;
        }
      ).code,
    );

    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';

      case 'auth/invalid-email':
        return 'Please enter a valid email address.';

      case 'auth/weak-password':
        return 'Please use a stronger password.';

      case 'auth/invalid-credential':
        return 'Incorrect email or password.';

      case 'auth/user-not-found':
        return 'No account was found with this email address.';

      case 'auth/wrong-password':
        return 'Incorrect password.';

      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';

      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}