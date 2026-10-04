import type {
  RegistrationRole,
} from '../types/auth';

export type AuthStackParamList = {
  Login: undefined;

  RoleSelection:
    | {
        mode?: 'email' | 'google';
      }
    | undefined;

  Register: {
    role: RegistrationRole;
    mode?: 'email' | 'google';
  };

  ForgotPassword: undefined;
};

export type RoleTabParamList = {
  Home: undefined;
  Activity: undefined;
  Services: undefined;
  Profile: undefined;
};