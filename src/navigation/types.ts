import type {
  RegistrationRole,
} from '../types/auth';

export type AuthStackParamList = {
  Login: undefined;

  RoleSelection:
    undefined;

  Register: {
    role:
      RegistrationRole;
  };

  ForgotPassword:
    undefined;
};