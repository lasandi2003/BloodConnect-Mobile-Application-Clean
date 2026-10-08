import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

import {
  auth,
} from '../../../config/firebase';

import type {
  RegisterInput,
  SocialProfileInput,
  UserProfile,
} from '../../../types/auth';

import {
  completeSocialProfile,
  getUserProfile,
  loginAccount,
  loginWithGoogleWeb,
  logoutAccount,
  registerAccount,
  resetAccountPassword,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  initializing: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  loginWithGoogle: () => Promise<
    'existing' | 'needs-profile'
  >;

  register: (
    input: RegisterInput,
  ) => Promise<void>;

  completeGoogleProfile: (
    input: SocialProfileInput,
  ) => Promise<void>;

  logout: () => Promise<void>;

  resetPassword: (
    email: string,
  ) => Promise<void>;
}

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [initializing, setInitializing] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async firebaseUser => {
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          setInitializing(false);
          return;
        }

        try {
          const loadedProfile =
            await getUserProfile(
              firebaseUser.uid,
            );

          if (
            loadedProfile?.status ===
            'suspended'
          ) {
            await logoutAccount();

            setUser(null);
            setProfile(null);

            return;
          }

          setProfile(loadedProfile);
        } catch (error) {
          console.error(
            'Profile loading error:',
            error,
          );

          setProfile(null);
        } finally {
          setInitializing(false);
        }
      },
    );

    return unsubscribe;
  }, []);

  async function login(
    email: string,
    password: string,
  ): Promise<void> {
    const loadedProfile =
      await loginAccount(
        email,
        password,
      );

    setUser(auth.currentUser);
    setProfile(loadedProfile);
  }

  async function loginWithGoogle(): Promise<
    'existing' | 'needs-profile'
  > {
    const loadedProfile =
      await loginWithGoogleWeb();

    setUser(auth.currentUser);
    setProfile(loadedProfile);

    return loadedProfile
      ? 'existing'
      : 'needs-profile';
  }

  async function register(
    input: RegisterInput,
  ): Promise<void> {
    const newProfile =
      await registerAccount(input);

    setUser(auth.currentUser);
    setProfile(newProfile);
  }

  async function completeGoogleProfile(
    input: SocialProfileInput,
  ): Promise<void> {
    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      throw new Error(
        'Google account session was not found. Please sign in again.',
      );
    }

    const newProfile =
      await completeSocialProfile(
        currentUser,
        input,
      );

    setUser(currentUser);
    setProfile(newProfile);
  }

  async function logout(): Promise<void> {
    try {
      await logoutAccount();

      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error(
        'Logout error:',
        error,
      );

      throw error;
    }
  }

  async function resetPassword(
    email: string,
  ): Promise<void> {
    await resetAccountPassword(
      email,
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        initializing,
        login,
        loginWithGoogle,
        register,
        completeGoogleProfile,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}