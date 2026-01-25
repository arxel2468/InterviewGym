'use client'

import { useState, useRef, useCallback } from 'react'

export type RecordingState = 'idle' | 'recording' | 'processing'

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const getSupportedMimeType = (): string => {
    // Prefer formats that Whisper handles well
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm' // fallback
  }

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Whisper prefers 16kHz
        },
      })

      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      console.log('Recording with mimeType:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second

      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      setState('recording')
    } catch (err: any) {
      console.error('Failed to start recording:', err)
      setError(err.message || 'Could not access microphone')
      setState('idle')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || state !== 'recording') {
        resolve(null)
        return
      }

      setState('processing')

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      const mediaRecorder = mediaRecorderRef.current

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        if (chunksRef.current.length === 0) {
          console.error('No audio chunks recorded')
          setError('No audio recorded')
          setState('idle')
          resolve(null)
          return
        }

        // Get the mime type from the recorder
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })

        console.log('Recorded audio:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: chunksRef.current.length,
          duration: duration,
        })

        chunksRef.current = []
        setState('idle')
        setDuration(0)
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }, [state, duration])

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    chunksRef.current = []
    setState('idle')
    setDuration(0)
  }, [state])

  return {
    state,
    duration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
  }
}
