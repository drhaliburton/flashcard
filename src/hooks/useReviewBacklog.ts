import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'flashcards:review-backlog'

function loadBacklog(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

export function useReviewBacklog() {
  const [backlog, setBacklog] = useState<Set<string>>(loadBacklog)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...backlog]))
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — backlog just won't persist
    }
  }, [backlog])

  const markForReview = useCallback((id: string) => {
    setBacklog((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const removeFromReview = useCallback((id: string) => {
    setBacklog((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  return { backlog, markForReview, removeFromReview }
}
