import { useContext } from 'react';
import { StaffAuthContext } from '../contexts/staffAuth';

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (!context) throw new Error('StaffAuthProvider is missing');
  return context;
}
