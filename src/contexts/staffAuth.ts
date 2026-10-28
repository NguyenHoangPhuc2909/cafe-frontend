import { createContext } from 'react';
import type { StaffSession } from '../types/staffApi';

export const StaffAuthContext = createContext<{
  session: StaffSession | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  isSigningIn: boolean;
  isAuthenticated: boolean;
  verificationError: string | null;
  retryVerification: () => void;
  error: string | null;
} | null>(null);
