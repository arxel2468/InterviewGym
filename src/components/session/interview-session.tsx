'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { useSessionStorage } from '@/hooks/use-session-storage'
import { useAudioLevel } from '@/hooks/use-audio-level'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { speakText, stopSpeaking, isBrowserTTSSupported } from '@/lib/browser-tts'
import { INTERVIEW_CONFIGS, InterviewType } from '@/lib/questions'
import { SilenceTimer } from './silence-timer'
import { TypingIndicator } from './typing-indicator'
import {
  Mic,
  Square,
  Loader2,
  Volume2,
  VolumeX,
  MessageSquare,
  User,
  AlertTriangle,
  PhoneOff,
  WifiOff
} from 'lucide-react'

type Message = {
  role: 'interviewer' | 'candidate'
  content: string
  timestamp: Date
  durationMs?: number
}

type SessionState =
  | 'initializing'
  | 'interviewer_speaking'
  | 'waiting_for_candidate'
  | 'candidate_speaking'
  | 'processing'
  | 'error'
  | 'ending'
  | 'ended'

interface InterviewSessionProps {
  sessionId: string
  difficulty: 'warmup' | 'standard' | 'intense'
  interviewType: string
  targetRole: string
}

// Replace ATMOSPHERIC_MESSAGES in interview-session.tsx:

const ATMOSPHERIC_MESSAGES: Record<string, string[]> = {
  warmup: [
    'Taking a moment to review your answer...',
    'Great, let me think about that...',
    'Noted. Preparing the next question...',
  ],
  standard: [
    'The interviewer is reviewing your response...',
    'Taking notes...',
    'Preparing the next question...',
  ],
  intense: [
    '...',
    'Reviewing.',
    'Noted.',
    'The panel is discussing.',
    'Next question coming up.',
  ],
}


export function InterviewSession({
  sessionId,
  difficulty,
  interviewType,
  targetRole,
}: InterviewSessionProps) {
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const { saveState, clearState, restoreMessages, isRestored } = useSessionStorage(sessionId)
  const { level: audioLevel, startMonitoring, stopMonitoring } = useAudioLevel()

  const [state, setState] = useState<SessionState>('initializing')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [atmosphericMessage, setAtmosphericMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingStartTime = useRef<number>(0)
  const hasInitialized = useRef(false)
  const currentAudio = useRef<HTMLAudioElement | null>(null)
  const isEndingRef = useRef(false)

  const candidateMessageCount = messages.filter((m) => m.role === 'candidate').length
  const estimatedTotal = INTERVIEW_CONFIGS[interviewType as InterviewType]?.questionCount || 6
  const progress = Math.min(100, (candidateMessageCount / estimatedTotal) * 100)

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recordError,
  } = useAudioRecorder()

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-interrupt for intense mode (after 45 seconds of recording)
  useEffect(() => {
    if (difficulty !== 'intense' || !isRecording) return

    const timeout = setTimeout(async () => {
      if (isRecording && duration >= 45) {
        // Stop recording and submit what we have
        handleStopRecording()
      }
    }, 45000)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, difficulty])

  // Initialize session
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const savedMessages = restoreMessages()
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages)
      setState('waiting_for_candidate')
      return
    }

    startInterview()

    return () => {
      stopSpeaking()
      stopMonitoring()
      if (currentAudio.current) {
        currentAudio.current.pause()
        currentAudio.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestored])

  // Persist state
  useEffect(() => {
    if (messages.length > 0) {
      saveState(messages)
    }
  }, [messages, saveState])

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state !== 'ended' && state !== 'error' && messages.length > 0) {
        e.preventDefault()
        e.returnValue = 'Interview in progress. Are you sure?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state, messages.length])

  // Keyboard: Space to start/stop recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        if (state === 'waiting_for_candidate' && !isRecording) {
          handleStartRecording()
        } else if (isRecording) {
          handleStopRecording()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isRecording])

  const getAtmosphericMessage = () => {
    const msgs = ATMOSPHERIC_MESSAGES[difficulty] || ATMOSPHERIC_MESSAGES.standard
    return msgs[Math.floor(Math.random() * msgs.length)]
  }

  // ─── Audio Playback ────────────────────────────────────────

  const playAudioBase64 = useCallback(async (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const binaryString = atob(base64Audio)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        currentAudio.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(url)
          currentAudio.current = null
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          currentAudio.current = null
          reject(new Error('Audio playback failed'))
        }
        audio.play().catch(reject)
      } catch (err) {
        reject(err)
      }
    })
  }, [])

  // ─── TTS: Chunked Cloud with Browser Fallback ──────────────

  const speakInterviewerResponse = useCallback(
    async (text: string) => {
      if (isMuted) {
        setState('waiting_for_candidate')
        return
      }

      setState('interviewer_speaking')

      try {
        // Request first chunk only — faster response
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, chunked: true }),
        })

        const data = await response.json()

        if (data.shouldUseBrowserTTS || !data.audio) {
          // Fallback to browser TTS
          await speakWithBrowser(text)
          setState('waiting_for_candidate')
          return
        }

        // Play first chunk immediately
        await playAudioBase64(data.audio)

        // If there's remaining text, synthesize and play it
        if (data.remainingText) {
          try {
            const restResponse = await fetch('/api/voice/synthesize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: data.remainingText, chunked: false }),
            })

            const restData = await restResponse.json()

            if (restData.audio && !restData.shouldUseBrowserTTS) {
              await playAudioBase64(restData.audio)
            } else {
              await speakWithBrowser(data.remainingText)
            }
          } catch {
            await speakWithBrowser(data.remainingText)
          }
        }
      } catch {
        // Complete fallback
        await speakWithBrowser(text)
      }

      setState('waiting_for_candidate')
    },
    [isMuted, playAudioBase64]
  )

  const speakWithBrowser = async (text: string): Promise<void> => {
    if (!isBrowserTTSSupported()) return
    return new Promise<void>((resolve) => {
      speakText(text, {
        onEnd: resolve,
        onError: () => resolve(),
      })
    })
  }

  // ─── Interview Flow ────────────────────────────────────────

  const startInterview = async () => {
    setState('initializing')
    setAtmosphericMessage('The interviewer is joining...')

    try {
      const response = await fetch('/api/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          difficulty,
          interviewType,
          targetRole,
          conversationHistory: [],
        }),
      })

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(data.friendlyMessage || data.error || 'Failed to start')
      }

      const message: Message = {
        role: 'interviewer',
        content: data.response,
        timestamp: new Date(),
      }
      setMessages([message])
      await speakInterviewerResponse(data.response)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      setError(msg)
      setState('error')
    }
  }

  const handleStartRecording = async () => {
    setError(null)
    try {
      recordingStartTime.current = Date.now()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      startMonitoring(stream)
      await startRecording()
      setState('candidate_speaking')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access microphone'
      setError(msg)
      setState('waiting_for_candidate')
    }
  }

  const handleStopRecording = async () => {
    stopMonitoring()
    const audioBlob = await stopRecording()

    if (!audioBlob || audioBlob.size < 1000) {
      setError('Recording too short. Please try again.')
      setState('waiting_for_candidate')
      return
    }

    const durationMs = Date.now() - recordingStartTime.current
    setState('processing')
    setAtmosphericMessage(getAtmosphericMessage())

    try {
      // Transcribe
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const transcribeRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      const transcribeData = await transcribeRes.json()

      if (!transcribeRes.ok || transcribeData.success === false) {
        throw new Error(transcribeData.friendlyMessage || 'Could not hear you')
      }

      if (!transcribeData.text?.trim()) {
        throw new Error('No speech detected. Please try again.')
      }

      const candidateMessage: Message = {
        role: 'candidate',
        content: transcribeData.text,
        timestamp: new Date(),
        durationMs,
      }

      const updatedMessages = [...messages, candidateMessage]
      setMessages(updatedMessages)

      // Check if should end
      const candidateCount = updatedMessages.filter((m) => m.role === 'candidate').length
      if (candidateCount >= estimatedTotal) {
        await endInterview(updatedMessages)
        return
      }

      // Get next response
      setAtmosphericMessage(getAtmosphericMessage())

      const interviewRes = await fetch('/api/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          difficulty,
          interviewType,
          targetRole,
          conversationHistory: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const interviewData = await interviewRes.json()

      if (!interviewRes.ok || interviewData.success === false) {
        throw new Error(interviewData.friendlyMessage || 'Interviewer disconnected')
      }

      if (interviewData.isClosing) {
        const closingMessage: Message = {
          role: 'interviewer',
          content: interviewData.response,
          timestamp: new Date(),
        }
        const finalMessages = [...updatedMessages, closingMessage]
        setMessages(finalMessages)
        await speakInterviewerResponse(interviewData.response)
        setTimeout(() => endInterview(finalMessages), 2000)
        return
      }

      const interviewerMessage: Message = {
        role: 'interviewer',
        content: interviewData.response,
        timestamp: new Date(),
      }
      setMessages([...updatedMessages, interviewerMessage])
      await speakInterviewerResponse(interviewData.response)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setState('waiting_for_candidate')
    }
  }

  const endInterview = async (finalMessages: Message[], retryCount = 0) => {
    if (isEndingRef.current) return
    isEndingRef.current = true

    setState('ending')
    setAtmosphericMessage('Generating your feedback...')

    try {
      const response = await fetch(`/api/session/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: finalMessages.map((m) => ({
            role: m.role,
            content: m.content,
            durationMs: m.durationMs || 0,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to save session')

      setState('ended')
      clearState()
      setTimeout(() => {
        router.push(`/dashboard/session/${sessionId}/feedback`)
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save session'

      if (retryCount < 2) {
        isEndingRef.current = false
        setAtmosphericMessage('Saving your session... retrying...')
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return endInterview(finalMessages, retryCount + 1)
      }

      setError(msg + '. Your responses were recorded — please try refreshing.')
      setState('error')
      isEndingRef.current = false
    }
  }

  const handleEndInterview = async () => {
    if (messages.length < 2) {
      try {
        await fetch(`/api/session/${sessionId}/abandon`, { method: 'POST' })
      } catch {
        // Ignore abandon errors
      }
      router.push('/dashboard')
      return
    }
    await endInterview(messages)
  }

  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking()
      if (currentAudio.current) {
        currentAudio.current.pause()
      }
    }
    setIsMuted(!isMuted)
  }

  const handleRetry = () => {
    setError(null)
    if (messages.length === 0) {
      hasInitialized.current = false
      startInterview()
    } else {
      setState('waiting_for_candidate')
    }
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <p className="text-sm text-amber-300">
            You're offline. Reconnect to continue the interview.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white capitalize">
            {interviewType.replace('_', ' ')} Interview
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-zinc-400 capitalize">{difficulty}</p>
            <span className="text-zinc-600">•</span>
            <p className="text-sm text-zinc-400">
              Question {candidateMessageCount + 1} of ~{estimatedTotal}
            </p>
          </div>
          <div className="w-48 h-1 bg-zinc-800 rounded-full mt-2">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleMute} className="border-zinc-700">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndInterview}
            className="border-zinc-700 text-red-400 hover:text-red-300"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End
          </Button>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 bg-zinc-900/50 border-zinc-800 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'candidate' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'interviewer'
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {message.role === 'interviewer' ? (
                  <MessageSquare className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'interviewer'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-violet-500/20 text-zinc-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          {(state === 'initializing' || state === 'processing' || state === 'ending') && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <TypingIndicator />
                  <p className="text-xs text-zinc-500 mt-1">{atmosphericMessage}</p>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 border-t border-zinc-800 bg-red-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="border-red-500/30 text-red-400"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex flex-col items-center justify-center gap-2">
            {state === 'waiting_for_candidate' && !isRecording && (
              <>
                <SilenceTimer
                  isActive={state === 'waiting_for_candidate' && !isRecording}
                  difficulty={difficulty}
                />
                <Button
                  size="lg"
                  onClick={handleStartRecording}
                  disabled={!isOnline}
                  className="bg-gradient-primary hover:opacity-90 h-14 px-8"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Speaking
                </Button>
                <p className="text-xs text-zinc-500">or press Space</p>
              </>
            )}

            {isRecording && (
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="h-14 px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop ({duration}s)
                </Button>
                {/* Audio level indicator */}
                <div className="flex items-end gap-0.5 h-8">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-violet-500 transition-all duration-75"
                      style={{
                        height: `${Math.max(12, audioLevel > i * 20 ? Math.min(100, audioLevel + 10) : 12)}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {state === 'interviewer_speaking' && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>Interviewer speaking...</span>
              </div>
            )}

            {(state === 'processing' || state === 'ending') && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{state === 'ending' ? 'Generating feedback...' : 'Processing...'}</span>
              </div>
            )}

            {state === 'ended' && (
              <div className="text-green-400">Interview complete! Redirecting...</div>
            )}
          </div>

          {recordError && <p className="text-red-400 text-sm text-center mt-2">{recordError}</p>}
        </div>
      </Card>
    </div>
  )
}
