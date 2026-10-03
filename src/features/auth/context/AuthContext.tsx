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
  UserProfile,
} from '../../../types/auth';

import {
  getUserProfile,
  loginAccount,
  logoutAccount,
  registerAccount,
  resetAccountPassword,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;

  profile:
    | UserProfile
    | null;

  initializing: boolean;

  login:
    (
      email: string,
      password: string,
    ) => Promise<void>;

  register:
    (
      input: RegisterInput,
    ) => Promise<void>;

  logout:
    () => Promise<void>;

  resetPassword:
    (
      email: string,
    ) => Promise<void>;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

interface AuthProviderProps {
  children:
    React.ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    profile,
    setProfile,
  ] =
    useState<
      UserProfile | null
    >(null);

  const [
    initializing,
    setInitializing,
  ] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          firebaseUser,
        ) => {
          setUser(
            firebaseUser,
          );

          if (
            !firebaseUser
          ) {
            setProfile(
              null,
            );

            setInitializing(
              false,
            );

            return;
          }

          try {
            const loadedProfile =
              await getUserProfile(
                firebaseUser.uid,
              );

            if (
              loadedProfile
                ?.status ===
              'suspended'
            ) {
              await logoutAccount();

              setUser(null);
              setProfile(null);
            } else {
              setProfile(
                loadedProfile,
              );
            }
          } catch (
            error
          ) {
            console.error(
              'Profile loading error:',
              error,
            );

            setProfile(
              null,
            );
          } finally {
            setInitializing(
              false,
            );
          }
        },
      );

    return unsubscribe;
  }, []);

  async function login(
    email: string,
    password: string,
  ) {
    const loadedProfile =
      await loginAccount(
        email,
        password,
      );

    setUser(
      auth.currentUser,
    );

    setProfile(
      loadedProfile,
    );
  }

  async function register(
    input: RegisterInput,
  ) {
    const newProfile =
      await registerAccount(
        input,
      );

    setUser(
      auth.currentUser,
    );

    setProfile(
      newProfile,
    );
  }

  async function logout() {
    await logoutAccount();

    setUser(null);
    setProfile(null);
  }

  async function resetPassword(
    email: string,
  ) {
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
        register,
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
    useContext(
      AuthContext,
    );

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}