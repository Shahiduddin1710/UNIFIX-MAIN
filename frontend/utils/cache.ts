
import AsyncStorage from '@react-native-async-storage/async-storage'

export async function saveCache(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }))
  } catch {}
}

export async function saveUserCache(user: any): Promise<void> {
  try {
    // Merge with whatever's already cached (e.g. {uid, role, route} written
    // by _layout.tsx for offline routing) instead of overwriting it —
    // otherwise we wipe the fields needed to route offline on next launch.
    const existingStr = await AsyncStorage.getItem("unifix_cached_user")
    const existing = existingStr ? JSON.parse(existingStr) : {}
    await AsyncStorage.setItem(
      "unifix_cached_user",
      JSON.stringify({ ...existing, ...user, cachedAt: Date.now() })
    )
  } catch {}
}

export async function loadUserCache(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem("unifix_cached_user")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const AGE_LIMIT = 7 * 24 * 60 * 60 * 1000 // 7 days
    if (Date.now() - (parsed.cachedAt ?? 0) > AGE_LIMIT) {
      await AsyncStorage.removeItem("unifix_cached_user")
      return null
    }
    return parsed
  } catch { return null }
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