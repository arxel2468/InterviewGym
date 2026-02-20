// src/hooks/use-session-storage.ts

'use client'

import { useState, useEffect, useCallback } from 'react'

type StoredMessage = {
  role: 'interviewer' | 'candidate'
  content: string
  timestamp: string
  durationMs?: number
}

type SessionState = {
  sessionId: string
  messages: StoredMessage[]
  lastUpdated: string
}

const STORAGE_KEY = 'interviewgym_session'
const EXPIRY_MS = 2 * 60 * 60 * 1000

export function useSessionStorage(sessionId: string) {
  const [isRestored, setIsRestored] = useState(false)

  const getSavedState = useCallback((): SessionState | null => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      const state: SessionState = JSON.parse(saved)

      if (state.sessionId !== sessionId) return null

      const lastUpdated = new Date(state.lastUpdated).getTime()
      if (Date.now() - lastUpdated > EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return state
    } catch {
      return null
    }
  }, [sessionId])

  const saveState = useCallback(
    (messages: { role: string; content: string; timestamp: Date; durationMs?: number }[]) => {
      if (typeof window === 'undefined') return

      const state: SessionState = {
        sessionId,
        messages: messages.map((m) => ({
          role: m.role as 'interviewer' | 'candidate',
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          durationMs: m.durationMs,
        })),
        lastUpdated: new Date().toISOString(),
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Storage full or unavailable
      }
    },
    [sessionId]
  )

  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const restoreMessages = useCallback((): {
    role: 'interviewer' | 'candidate'
    content: string
    timestamp: Date
    durationMs?: number
  }[] | null => {
    const saved = getSavedState()
    if (!saved) return null

    return saved.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
      durationMs: m.durationMs,
    }))
  }, [getSavedState])

  useEffect(() => {
    setIsRestored(true)
  }, [])

  return {
    isRestored,
    saveState,
    clearState,
    restoreMessages,
    hasSavedState: !!getSavedState(),
  }
}
