// src/components/session/silence-timer.tsx

'use client'

import { useState, useEffect, useRef } from 'react'

interface SilenceTimerProps {
  isActive: boolean
  difficulty: 'warmup' | 'standard' | 'intense'
}

const THRESHOLDS = {
  warmup: { warning: 15, critical: 30 },
  standard: { warning: 10, critical: 20 },
  intense: { warning: 5, critical: 12 },
}

export function SilenceTimer({ isActive, difficulty }: SilenceTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      setSeconds(0)
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else {
      setSeconds(0)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive])

  if (!isActive || seconds < 3) return null

  const threshold = THRESHOLDS[difficulty]
  const isWarning = seconds >= threshold.warning
  const isCritical = seconds >= threshold.critical

  const color = isCritical
    ? 'text-red-400'
    : isWarning
      ? 'text-amber-400'
      : 'text-zinc-500'

  const message = isCritical
    ? difficulty === 'intense'
      ? 'The interviewer is waiting...'
      : 'Take your time, but try to respond soon.'
    : isWarning
      ? 'Silence noted.'
      : ''

  return (
    <div className={`flex items-center gap-2 text-xs ${color} transition-colors`}>
      <div
        className={`w-2 h-2 rounded-full ${
          isCritical ? 'bg-red-400 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-zinc-600'
        }`}
      />
      <span>{seconds}s</span>
      {message && <span className="italic">{message}</span>}
    </div>
  )
}
