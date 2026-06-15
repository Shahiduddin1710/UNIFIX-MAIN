import NetInfo from '@react-native-community/netinfo';
import {
  clearLostReports,
  deleteLostReportById,
  deleteLostReportsByIds,
  getAllClaims,
  getLostFoundFeed,
  getLostReports,
  getMyLostFoundPosts,
  getMyLostReports,
  upsertClaims,
  upsertLostFoundItems,
  upsertLostReports,
} from '../db/lostFoundDb';
import { getMeta, setMeta } from '../db/metadataDb';
import { lostFoundAPI, lostReportsAPI } from '../services/api';

const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
};

export const syncLostFoundFeed = async (): Promise<void> => {
  const online = await isOnline();
  if (!online) { 
    // console.log('[lf] offline, skipping feed sync'); 
    return; }
  try {
    const storedHash = await getMeta('lf_feed_hash');
    const hashRes = await lostFoundAPI.getFeedHash();
    // console.log('[lf] feed hash check:', { storedHash, newHash: hashRes?.hash });
    const existing = await getLostFoundFeed();
    if (storedHash && storedHash === hashRes?.hash && existing.length > 0) { 
      // console.log('[lf] feed hash match — skip');
       return; }
    const since = await getMeta('lf_feed_synced_at');
    const data = await lostFoundAPI.feedSince(since ? parseInt(since) : null);
    // console.log('[lf] feed data:', data);
    if (data?.items?.length > 0) await upsertLostFoundItems(data.items);
    await setMeta('lf_feed_hash', hashRes?.hash);
    await setMeta('lf_feed_synced_at', String(hashRes?.serverTime));
  } catch (e) { console.error('[lf] syncLostFoundFeed error:', e); }
};

export const syncMyLostFoundPosts = async (uid: string): Promise<void> => {
  const online = await isOnline();
  if (!online) return;
  try {
    const since = await getMeta('lf_myposts_synced_at');
    const data = await lostFoundAPI.myPostsSince(since ? parseInt(since) : null);
    if (data?.items?.length > 0) await upsertLostFoundItems(data.items);
    await setMeta('lf_myposts_synced_at', String(Date.now()));
  } catch {}
};

export const syncClaims = async (): Promise<void> => {
  const online = await isOnline();
  if (!online) return;
  try {
    const storedHash = await getMeta('lf_claims_hash');
    const hashRes = await lostFoundAPI.getClaimsHash();
    const existing = await getAllClaims();
    if (storedHash && storedHash === hashRes?.hash && existing.length > 0) return;
    const since = await getMeta('lf_claims_synced_at');
    const data = await lostFoundAPI.claimsSince(since ? parseInt(since) : null);
    if (data?.items?.length > 0) await upsertClaims(data.items);
    await setMeta('lf_claims_hash', hashRes?.hash);
    await setMeta('lf_claims_synced_at', String(hashRes?.serverTime));
  } catch {}
};

export const syncLostReports = async (forceRefresh?: boolean): Promise<void> => {
  const online = await isOnline();
  if (!online) return;
  try {
    if (forceRefresh) {
      await setMeta('lr_feed_hash', '');
      await setMeta('lr_feed_synced_at', '');
    }
    const storedHash = await getMeta('lr_feed_hash');
    // console.log('[lr] storedHash:', storedHash);
    const hashRes = await lostReportsAPI.getFeedHash();
    // console.log('[lr] hashRes:', hashRes);
    const existing = await getLostReports();
    if (storedHash && storedHash === hashRes?.hash && existing.length > 0) {
      // console.log('[lr] hash match — skip');
      return;
    }
    // console.log('[lr] hash changed — syncing...');
const since = await getMeta('lr_feed_synced_at');
    if (since && !forceRefresh) {
      const data = await lostReportsAPI.feedSince(parseInt(since));
      if (data?.deletedIds?.length > 0) await deleteLostReportsByIds(data.deletedIds);
      if (data?.items?.length > 0) await upsertLostReports(data.items);
    } else {
      // Full fetch — clear table first so hard-deleted docs don't survive
      const fullData = await lostReportsAPI.feedSince(null);
      await clearLostReports();
      if (fullData?.items?.length > 0) await upsertLostReports(fullData.items);
      if (fullData?.deletedIds?.length > 0) await deleteLostReportsByIds(fullData.deletedIds);
    }
    await setMeta('lr_feed_hash', hashRes?.hash);
    await setMeta('lr_feed_synced_at', String(hashRes?.serverTime));
    // console.log('[lr] sync complete, new hash:', hashRes?.hash);
  } catch (e) { console.error('[lr] syncLostReports error:', e); }
};

export const getLostFoundFeedFromDb = getLostFoundFeed;
export const getMyLostFoundPostsFromDb = getMyLostFoundPosts;
export const getLostReportsFromDb = getLostReports;
export const getMyLostReportsFromDb = getMyLostReports;
export const getAllClaimsFromDb = getAllClaims;
export { deleteLostFoundItemById } from '../db/lostFoundDb';
export { deleteLostReportById };

