import { create } from 'zustand'

type LoadingStore = {
  loadingMap: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void
  isLoading: (key: string) => boolean
  loaded: Record<string, boolean>
  markLoaded: (key: string) => void
  isLoaded: (key: string) => boolean
  dataCache: Record<string, any>
  setDataCache: (key: string, value: any) => void
  getDataCache: (key: string) => any
  activeTab: Record<string, string>
  setActiveTab: (screen: string, tab: string) => void
  getActiveTab: (screen: string, defaultTab: string) => string
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  loadingMap: {},
  setLoading: (key, value) =>
    set((state) => ({
      loadingMap: { ...state.loadingMap, [key]: value },
    })),
  isLoading: (key) => get().loadingMap[key] ?? false,

  loaded: {},
  markLoaded: (key) =>
    set((state) => ({
      loaded: { ...state.loaded, [key]: true },
    })),
  isLoaded: (key) => get().loaded[key] === true,

  dataCache: {},
  setDataCache: (key, value) =>
    set((state) => ({
      dataCache: { ...state.dataCache, [key]: value },
    })),
  getDataCache: (key) => get().dataCache[key] ?? null,

  activeTab: {},
  setActiveTab: (screen, tab) =>
    set((state) => ({
      activeTab: { ...state.activeTab, [screen]: tab },
    })),
  getActiveTab: (screen, defaultTab) =>
    get().activeTab[screen] ?? defaultTab,
}))