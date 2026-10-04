export type UserRole =
  | 'donor'
  | 'requester'
  | 'healthcare'
  | 'bloodBank'
  | 'admin';

export type RegistrationRole =
  | 'donor'
  | 'requester'
  | 'healthcare'
  | 'bloodBank';

export type HealthcareType =
  | 'doctor'
  | 'nurse';

export type UserStatus =
  | 'active'
  | 'suspended';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  healthcareType?: HealthcareType;
  status: UserStatus;
  photoURL?: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: RegistrationRole;
  healthcareType?: HealthcareType;
}

export interface SocialProfileInput {
  fullName: string;
  phone: string;
  role: RegistrationRole;
  healthcareType?: HealthcareType;
}