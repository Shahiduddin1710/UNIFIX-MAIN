import NetInfo from '@react-native-community/netinfo';
import { getAllComplaintsLocal, getComplaintsByUser, upsertComplaints } from '../db/complaintsDb';
import { getMeta, setMeta } from '../db/metadataDb';
import { complaintsAPI } from '../services/api';

const STUDENT_HASH_KEY = 'student_complaints_hash';
const STUDENT_SYNC_KEY = 'student_complaints_synced_at';
const ADMIN_HASH_KEY = 'admin_complaints_hash';
const ADMIN_SYNC_KEY = 'admin_complaints_synced_at';

const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
};

export const syncStudentComplaints = async (uid: string): Promise<void> => {
  const online = await isOnline();
  if (!online) return;

try {
    const storedHash = await getMeta(STUDENT_HASH_KEY);
    const hashRes = await complaintsAPI.getHash();
    const newHash = hashRes?.hash;

    if (storedHash && storedHash === newHash) {
      return;
    }

    const since = await getMeta(STUDENT_SYNC_KEY);
    const data = await complaintsAPI.myComplaintsSince(since ? parseInt(since) : null);

    const incoming = data?.complaints ?? [];

    if (incoming.length > 0) {
      await upsertComplaints(incoming);
    }

    await setMeta(STUDENT_HASH_KEY, newHash);
    await setMeta(STUDENT_SYNC_KEY, String(hashRes.serverTime));
} catch (e: any) {
    console.error('[sync] syncStudentComplaints error:', e?.message, e?.stack, JSON.stringify(e));
  }
};

export const syncAdminComplaints = async (): Promise<void> => {
  const online = await isOnline();
  
  if (!online) return;

  try {
    const storedHash = await getMeta(ADMIN_HASH_KEY);


    const hashRes = await complaintsAPI.getAdminHash();
   
    const newHash = hashRes?.hash;

  if (storedHash && storedHash === newHash) {
      
      return; 
    }

    const since = await getMeta(ADMIN_SYNC_KEY);
 

    const data = await complaintsAPI.allComplaintsSince(since ? parseInt(since) : null);
  
    const incoming = data?.complaints ?? [];
   

    if (incoming.length > 0) {
      await upsertComplaints(incoming);
    
    }

    await setMeta(ADMIN_HASH_KEY, newHash);
    await setMeta(ADMIN_SYNC_KEY, String(hashRes.serverTime));
  } catch (e: any) {
    console.error('[sync] syncAdminComplaints error:', e?.message, e?.stack, JSON.stringify(e));
  }
};

export const getStudentComplaintsFromDb = async (uid: string) => {
  return getComplaintsByUser(uid);
};

export const forceRefreshStudentComplaints = async (uid: string): Promise<void> => {
  const online = await isOnline();
  if (!online) return;
  try {
    await setMeta(STUDENT_HASH_KEY, '');
    await setMeta(STUDENT_SYNC_KEY, '');
    await syncStudentComplaints(uid);
  } catch {}
};
export const getAdminComplaintsFromDb = async () => {
  return getAllComplaintsLocal();
};

const STAFF_HASH_KEY = 'staff_complaints_hash';
const STAFF_SYNC_KEY = 'staff_complaints_synced_at';

export const syncStaffComplaints = async (): Promise<void> => {
  const online = await isOnline();
  if (!online) return;
  try {
    const storedHash = await getMeta(STAFF_HASH_KEY);
    const hashRes = await complaintsAPI.getStaffHash();
    const newHash = hashRes?.hash;
  
    if (storedHash && storedHash === newHash) { return; }
    const since = await getMeta(STAFF_SYNC_KEY);
 
    const data = await complaintsAPI.staffComplaintsSince(since ? parseInt(since) : null);

    const combined = [
      ...(data.pending || []),
      ...(data.active || []),
      ...(data.completed || []),
      ...(data.rejected || []),
    ];
    const seen = new Set<string>();
    const unique = combined.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    if (unique.length > 0) await upsertComplaints(unique);
    await setMeta(STAFF_HASH_KEY, newHash);
    await setMeta(STAFF_SYNC_KEY, String(hashRes.serverTime));
  } catch (e) {
    console.error('[sync] syncStaffComplaints error:', e);
  }
};

export const getStaffComplaintsFromDb = async (uid: string) => {
  return getAllComplaintsLocal();
};