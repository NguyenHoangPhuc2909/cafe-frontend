import { useContext } from 'react';
import { GuestSessionContext } from '../contexts/guestSession';

export function useGuestSession() {
  const value = useContext(GuestSessionContext);
  if (!value) throw new Error('GuestSessionProvider is missing');
  return value;
}
