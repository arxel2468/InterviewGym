'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { speakText, stopSpeaking, isBrowserTTSSupported } from '@/lib/browser-tts'
import { 
  Mic, 
  Square, 
  Loader2, 
  Volume2,
  VolumeX,
  MessageSquare,
  User,
  AlertTriangle,
  PhoneOff
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
}

const STATE_MESSAGES: Record<SessionState, string> = {
  initializing: 'Connecting to interviewer...',
  interviewer_speaking: 'Interviewer is speaking...',
  waiting_for_candidate: 'Your turn to respond',
  candidate_speaking: 'Recording your response...',
  processing: 'Processing...',
  error: 'Something went wrong',
  ending: 'Wrapping up the interview...',
  ended: 'Interview complete',
}

const ATMOSPHERIC_MESSAGES = [
  'The interviewer is reviewing your response...',
  'Taking notes...',
  'The interviewer considers your answer...',
  'Preparing the next question...',
  'The interviewer nods thoughtfully...',
]


export function InterviewSession({ 
  sessionId, 
  difficulty, 
  interviewType 
}: InterviewSessionProps) {
  const router = useRouter()
  
  // State
  const [state, setState] = useState<SessionState>('initializing')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [atmosphericMessage, setAtmosphericMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingStartTime = useRef<number>(0)
  const hasInitialized = useRef(false)

  // Audio recorder
  const { 
    isRecording, 
    duration, 
    startRecording, 
    stopRecording,
    error: recordError 
  } = useAudioRecorder()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start interview on mount
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) return
    hasInitialized.current = true

    startInterview()

    // Cleanup function
    return () => {
      stopSpeaking() // Stop any TTS on unmount
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state !== 'ended' && state !== 'error' && messages.length > 0) {
        e.preventDefault()
        e.returnValue = 'You have an interview in progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state, messages.length])


  // Get random atmospheric message
  const getAtmosphericMessage = () => {
    return ATMOSPHERIC_MESSAGES[Math.floor(Math.random() * ATMOSPHERIC_MESSAGES.length)]
  }

  // Start the interview
  const startInterview = async () => {
    setState('initializing')
    setAtmosphericMessage('The interviewer is joining the call...')

    try {
      const response = await fetch('/api/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, // ADD THIS
          difficulty,
          interviewType,
          conversationHistory: [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start interview')
      }

      const data = await response.json()
      
      if (data.success === false) {
        throw new Error(data.friendlyMessage || 'Failed to connect')
      }

      // Add interviewer message
      const interviewerMessage: Message = {
        role: 'interviewer',
        content: data.response,
        timestamp: new Date(),
      }
      setMessages([interviewerMessage])

      // Speak the response
      await speakInterviewerResponse(data.response)
      
    } catch (err: any) {
      console.error('Failed to start interview:', err)
      setError(err.message || 'Failed to connect to interviewer')
      setState('error')
    }
  }

  // Speak interviewer response
  const speakInterviewerResponse = async (text: string) => {
    if (isMuted) {
      setState('waiting_for_candidate')
      return
    }

    setState('interviewer_speaking')

    try {
      // Try Groq TTS first
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (data.shouldUseBrowserTTS || !data.audio) {
        // Use browser TTS
        await new Promise<void>((resolve) => {
          speakText(text, {
            onEnd: () => resolve(),
            onError: () => resolve(),
          })
        })
      } else {
        // Play Groq audio
        const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))
        const audioBlob = new Blob([audioData], { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            // Fallback to browser TTS
            speakText(text, {
              onEnd: () => resolve(),
              onError: () => resolve(),
            })
          }
          audio.play()
        })
      }
    } catch (err) {
      console.error('TTS failed, using browser:', err)
      if (isBrowserTTSSupported()) {
        await new Promise<void>((resolve) => {
          speakText(text, {
            onEnd: () => resolve(),
            onError: () => resolve(),
          })
        })
      }
    }

    setState('waiting_for_candidate')
  }

  // Handle start recording
  const handleStartRecording = async () => {
    setError(null)
    recordingStartTime.current = Date.now()
    await startRecording()
    setState('candidate_speaking')
  }

  // Handle stop recording and process
  const handleStopRecording = async () => {
  const audioBlob = await stopRecording()

  if (!audioBlob) {
    setError('No audio recorded. Please try again.')
    setState('waiting_for_candidate')
    return
  }

  if (audioBlob.size < 1000) {
    setError('Recording too short. Please speak for at least 1 second.')
    setState('waiting_for_candidate')
    return
  }

  const durationMs = Date.now() - recordingStartTime.current

  setState('processing')
  setAtmosphericMessage(getAtmosphericMessage())

  try {
    // Transcribe audio
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    const transcribeResponse = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    })

    const transcribeData = await transcribeResponse.json()

    if (!transcribeResponse.ok || transcribeData.success === false) {
      throw new Error(transcribeData.friendlyMessage || transcribeData.error || 'Transcription failed')
    }

    if (!transcribeData.text || transcribeData.text.trim().length === 0) {
      throw new Error('Could not understand audio. Please speak clearly and try again.')
    }

    const candidateText = transcribeData.text

    // Add candidate message
    const candidateMessage: Message = {
      role: 'candidate',
      content: candidateText,
      timestamp: new Date(),
      durationMs,
    }

    const updatedMessages = [...messages, candidateMessage]
    setMessages(updatedMessages)

    // Check if we should end the interview (after 5-7 exchanges)
    const candidateCount = updatedMessages.filter(m => m.role === 'candidate').length
    const shouldEnd = candidateCount >= 6

    if (shouldEnd) {
      await endInterview(updatedMessages)
      return
    }

    // Get interviewer response
    setAtmosphericMessage(getAtmosphericMessage())

    const interviewResponse = await fetch('/api/interview/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        difficulty,
        interviewType,
        conversationHistory: updatedMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    const interviewData = await interviewResponse.json()

    if (interviewData.success === false) {
      throw new Error(interviewData.friendlyMessage || 'Interviewer disconnected')
    }

    // Add interviewer message
    const interviewerMessage: Message = {
      role: 'interviewer',
      content: interviewData.response,
      timestamp: new Date(),
    }
    setMessages([...updatedMessages, interviewerMessage])

    // Speak response
    await speakInterviewerResponse(interviewData.response)

  } catch (err: any) {
    console.error('Processing failed:', err)
    setError(err.message || 'Something went wrong. Please try again.')
    setState('waiting_for_candidate')
  }
}

  // End interview
  const endInterview = async (finalMessages: Message[]) => {
    setState('ending')
    setAtmosphericMessage('The interviewer is wrapping up...')

    try {
      // Save session and generate feedback
      const response = await fetch(`/api/session/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: finalMessages.map(m => ({
            role: m.role,
            content: m.content,
            durationMs: m.durationMs || 0,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save session')
      }

      setState('ended')
      
      // Redirect to feedback page after a brief moment
      setTimeout(() => {
        router.push(`/dashboard/session/${sessionId}/feedback`)
      }, 1500)

    } catch (err: any) {
      console.error('Failed to end interview:', err)
      setError(err.message)
      setState('error')
    }
  }

  // Handle manual end
  const handleEndInterview = async () => {
    // If not enough conversation, mark as abandoned and go back
    if (messages.length < 2) {
      try {
        await fetch(`/api/session/${sessionId}/abandon`, {
          method: 'POST',
        })
      } catch (e) {
        // Ignore errors
      }
      router.push('/dashboard')
      return
    }
    endInterview(messages)
  }

  // Toggle mute
  const toggleMute = () => {
    if (!isMuted) {
      stopSpeaking()
    }
    setIsMuted(!isMuted)
  }

  // Retry after error
  const handleRetry = () => {
    setError(null)
    if (messages.length === 0) {
      startInterview()
    } else {
      setState('waiting_for_candidate')
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white capitalize">
            {interviewType.replace('_', ' ')} Interview
          </h1>
          <p className="text-sm text-zinc-400 capitalize">{difficulty} difficulty</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="border-zinc-700"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
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
              className={`flex gap-3 ${
                message.role === 'candidate' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${message.role === 'interviewer' 
                  ? 'bg-violet-500/20 text-violet-400' 
                  : 'bg-blue-500/20 text-blue-400'}
              `}>
                {message.role === 'interviewer' 
                  ? <MessageSquare className="w-4 h-4" />
                  : <User className="w-4 h-4" />
                }
              </div>
              <div className={`
                max-w-[80%] p-3 rounded-lg
                ${message.role === 'interviewer'
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'bg-violet-500/20 text-zinc-200'}
              `}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Status indicator */}
          {(state === 'initializing' || state === 'processing' || state === 'ending') && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-sm text-zinc-400 italic">{atmosphericMessage}</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 border-t border-zinc-800 bg-red-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Recording controls */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-center gap-4">
            {state === 'waiting_for_candidate' && !isRecording && (
              <Button
                size="lg"
                onClick={handleStartRecording}
                className="bg-gradient-primary hover:opacity-90 h-14 px-8"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Speaking
              </Button>
            )}

            {isRecording && (
              <Button
                size="lg"
                onClick={handleStopRecording}
                variant="destructive"
                className="h-14 px-8"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop ({duration}s)
              </Button>
            )}

            {state === 'interviewer_speaking' && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>Interviewer is speaking...</span>
              </div>
            )}

            {(state === 'processing' || state === 'ending') && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{STATE_MESSAGES[state]}</span>
              </div>
            )}

            {state === 'ended' && (
              <div className="flex items-center gap-2 text-green-400">
                <span>Interview complete! Redirecting to feedback...</span>
              </div>
            )}
          </div>

          {recordError && (
            <p className="text-red-400 text-sm text-center mt-2">{recordError}</p>
          )}
        </div>
      </Card>
    </div>
  )
}
