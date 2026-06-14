import { useState, useEffect } from 'react'
import { getPoems } from '../lib/poems'
import type { Poem } from '../lib/db'

export function usePoems(options?: { grade?: number; type?: string; difficulty?: number }) {
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPoems(options).then(data => {
      setPoems(data)
      setLoading(false)
    })
  }, [options?.grade, options?.type, options?.difficulty])

  return { poems, loading }
}
