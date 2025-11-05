import { apiFetch } from './http-client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otpCode: string;
  idToken: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'AWAY';
}

export async function login(payload: LoginRequest) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterRequest) {
  return apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyOTP(payload: VerifyOTPRequest) {
  return apiFetch<VerifyOTPResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser() {
  return apiFetch<UserProfile>('/users/me');
}
