import { create } from 'zustand'

type LoadingStore = {
  loadingMap: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void
  isLoading: (key: string) => boolean
  loaded: Record<string, boolean>
  markLoaded: (key: string) => void
  isLoaded: (key: string) => boolean
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
}))