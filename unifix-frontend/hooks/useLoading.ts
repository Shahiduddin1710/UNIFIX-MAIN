import { useCallback, useRef } from 'react'
import { useLoadingStore } from '../store/loadingStore'

const MIN_DISPLAY_MS = 300

type UseLoadingReturn = {
  withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>
  setLoading: (key: string, value: boolean) => void
  isLoading: (key: string) => boolean
}

export function useLoading(): UseLoadingReturn {
  const { setLoading, isLoading } = useLoadingStore()
  const timerRef = useRef<Record<string, number>>({})

  const withLoading = useCallback(async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    setLoading(key, true)
    const startTime = Date.now()

    try {
      const result = await fn()
      const elapsed = Date.now() - startTime
      const remaining = MIN_DISPLAY_MS - elapsed

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      return result
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  return { withLoading, setLoading, isLoading }
}