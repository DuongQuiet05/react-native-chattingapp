import type { UserProfile } from './auth';
import { getFriendsList } from './friends';
export interface Contact extends UserProfile {
  lastSeen?: string;
}
export async function fetchContacts() {
  return getFriendsList();
}