'use client'

import { useState, useRef, useCallback } from 'react'

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      setError(null)

      // Stop any currently playing audio
      if (sourceRef.current) {
        sourceRef.current.stop()
        sourceRef.current = null
      }

      // Create or resume AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        audioData.slice(0)
      )

      // Create and play source
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)

      source.onended = () => {
        setIsPlaying(false)
        sourceRef.current = null
      }

      sourceRef.current = source
      source.start()
      setIsPlaying(true)
    } catch (err) {
      console.error('Failed to play audio:', err)
      setError('Failed to play audio')
      setIsPlaying(false)
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current = null
    }
    setIsPlaying(false)
  }, [])

  return {
    isPlaying,
    error,
    playAudio,
    stopAudio,
  }
}
