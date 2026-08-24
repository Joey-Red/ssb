import { useEffect, useState } from 'react'
import { loadFrameDataIndex, type FrameDataIndex } from '../data/frameData'

interface FrameDataState {
  data: FrameDataIndex | null
  error: string | null
  loading: boolean
}

const initialState: FrameDataState = { data: null, error: null, loading: true }
let resolvedData: FrameDataIndex | null = null
let resolvedError: string | null = null

function currentState(): FrameDataState {
  if (resolvedData) return { data: resolvedData, error: null, loading: false }
  if (resolvedError) return { data: null, error: resolvedError, loading: false }
  return initialState
}

export function useFrameDataIndex(): FrameDataState {
  const [state, setState] = useState<FrameDataState>(currentState)

  useEffect(() => {
    if (resolvedData || resolvedError) return

    let cancelled = false
    void loadFrameDataIndex()
      .then((data) => {
        resolvedData = data
        resolvedError = null
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Frame data failed to load.'
        resolvedError = message
        if (!cancelled) setState({ data: null, error: message, loading: false })
      })

    return () => { cancelled = true }
  }, [])

  return state
}
