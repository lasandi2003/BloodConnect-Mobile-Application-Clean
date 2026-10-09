import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { Platform } from 'react-native';

import {
  auth,
  db,
} from '../../../config/firebase';

import type {
  RegisterInput,
  SocialProfileInput,
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
  const snapshot = await getDoc(
    doc(db, USERS_COLLECTION, uid),
  );

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
    email: data.email ?? '',
    phone: data.phone ?? '',
    role,
    healthcareType: data.healthcareType,
    status: data.status ?? 'active',
    photoURL: data.photoURL ?? undefined,
  };
}

async function recordSuccessfulLogin(
  user: User,
) {
  await setDoc(
    doc(db, USERS_COLLECTION, user.uid),
    {
      email: user.email ?? '',
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

export async function registerAccount(
  input: RegisterInput,
): Promise<UserProfile> {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      input.email.trim().toLowerCase(),
      input.password,
    );

  try {
    await updateProfile(
      credential.user,
      {
        displayName: input.fullName.trim(),
      },
    );

    const profile: UserProfile = {
      uid: credential.user.uid,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: input.role,
      status: 'active',
      ...(input.healthcareType
        ? {
            healthcareType: input.healthcareType,
          }
        : {}),
    };

    await setDoc(
      doc(
        db,
        USERS_COLLECTION,
        credential.user.uid,
      ),
      {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
    );

    return profile;
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch {
      // Ignore cleanup errors.
    }

    throw error;
  }
}

export async function completeSocialProfile(
  user: User,
  input: SocialProfileInput,
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: user.uid,
    fullName:
      input.fullName.trim() ||
      user.displayName ||
      'BloodConnect User',
    email: user.email ?? '',
    phone: input.phone.trim(),
    role: input.role,
    status: 'active',
    photoURL: user.photoURL ?? undefined,
    ...(input.healthcareType
      ? {
          healthcareType: input.healthcareType,
        }
      : {}),
  };

  await setDoc(
    doc(db, USERS_COLLECTION, user.uid),
    {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  return profile;
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<UserProfile> {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

  const profile = await getUserProfile(
    credential.user.uid,
  );

  if (!profile) {
    await signOut(auth);

    throw new Error(
      'No BloodConnect Firestore profile was found for this account.',
    );
  }

  if (profile.status === 'suspended') {
    await signOut(auth);

    throw new Error(
      'This account has been suspended.',
    );
  }

  await recordSuccessfulLogin(
    credential.user,
  );

  return profile;
}

export async function loginWithGoogleWeb(): Promise<
  UserProfile | null
> {
  if (Platform.OS !== 'web') {
    throw new Error(
      'Google Sign-In on Android/iOS needs the native Google OAuth configuration. Use email login in Expo Go for now.',
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const credential = await signInWithPopup(
    auth,
    provider,
  );

  const profile = await getUserProfile(
    credential.user.uid,
  );

  if (profile) {
    if (profile.status === 'suspended') {
      await signOut(auth);
      throw new Error(
        'This account has been suspended.',
      );
    }

    await recordSuccessfulLogin(
      credential.user,
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
    email.trim().toLowerCase(),
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
      (error as { code?: string }).code,
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
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'The browser blocked the Google sign-in popup.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using another sign-in method.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}