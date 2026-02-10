// src/hooks/use-session-storage.ts

import { useState, useEffect, useCallback } from 'react'

type Message = {
  role: 'interviewer' | 'candidate'
  content: string
  timestamp: string
  durationMs?: number
}

type SessionState = {
  sessionId: string
  messages: Message[]
  lastUpdated: string
}

const STORAGE_KEY = 'interviewgym_session'
const EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 hours

export function useSessionStorage(sessionId: string) {
  const [isRestored, setIsRestored] = useState(false)

  // Get saved state
  const getSavedState = useCallback((): SessionState | null => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      const state: SessionState = JSON.parse(saved)

      // Check if same session
      if (state.sessionId !== sessionId) return null

      // Check if expired
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

  // Save state
  const saveState = useCallback((messages: Message[]) => {
    if (typeof window === 'undefined') return

    const state: SessionState = {
      sessionId,
      messages: messages.map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      })),
      lastUpdated: new Date().toISOString(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or unavailable
    }
  }, [sessionId])

  // Clear state
  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Restore messages
  const restoreMessages = useCallback((): Message[] | null => {
    const saved = getSavedState()
    if (!saved) return null

    return saved.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })) as Message[]
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
