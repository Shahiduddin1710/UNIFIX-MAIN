// Replace your entire cache.ts with this:

import AsyncStorage from '@react-native-async-storage/async-storage'

// Save cache with timestamp
export async function saveCache(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }))
  } catch {}
}

export async function loadCache(key: string, maxAgeMs = 10 * 60 * 1000, forceLoad = false): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return null
    const { data, savedAt } = JSON.parse(raw)
    if (!forceLoad && Date.now() - savedAt > maxAgeMs) return null
    return data
  } catch { return null }
}

export async function loadCacheForce(key: string): Promise<any | null> {
  return loadCache(key, 0, true)
}