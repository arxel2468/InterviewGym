// src/hooks/use-audio-level.ts
'use client'

import { useState, useRef, useCallback } from 'react'

export function useAudioLevel() {
  const [level, setLevel] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number>(0)

  const startMonitoring = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setLevel(Math.min(100, Math.round((average / 128) * 100)))
      animationRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const stopMonitoring = useCallback(() => {
    cancelAnimationFrame(animationRef.current)
    setLevel(0)
  }, [])

  return { level, startMonitoring, stopMonitoring }
}
