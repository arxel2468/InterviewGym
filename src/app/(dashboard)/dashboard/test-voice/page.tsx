'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { 
  Mic, 
  Square, 
  Volume2, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  RefreshCw 
} from 'lucide-react'
import { speakText, stopSpeaking, isBrowserTTSSupported } from '@/lib/browser-tts'

type ModelRankings = {
  stt: string[]
  tts: string[]
  chat: string[]
}

type TestResult = {
  success: boolean
  model?: string
  wasDegraded?: boolean
  fallbackMessage?: string
  error?: string
}

export default function TestVoicePage() {
  // State
  const [transcript, setTranscript] = useState('')
  const [interviewerResponse, setInterviewerResponse] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Results
  const [sttResult, setSttResult] = useState<TestResult | null>(null)
  const [ttsResult, setTtsResult] = useState<TestResult | null>(null)
  const [chatResult, setChatResult] = useState<TestResult | null>(null)
  
  // Models
  const [rankings, setRankings] = useState<ModelRankings | null>(null)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  
  const { 
    isRecording, 
    duration, 
    startRecording, 
    stopRecording,
    error: recordError 
  } = useAudioRecorder()

  // Fetch model rankings on mount
  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/models')
      const data = await res.json()
      if (data.success) {
        setRankings(data.rankings)
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err)
    }
  }

  const handleRefreshCache = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/models', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setRankings(data.rankings)
      }
    } catch (err) {
      console.error('Failed to refresh cache:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Test STT
  const handleStopAndTranscribe = async () => {
    const audioBlob = await stopRecording()
    if (!audioBlob) return

    setIsTranscribing(true)
    setRetryMessage(null)
    setSttResult(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success === false) {
        setSttResult({
          success: false,
          error: data.friendlyMessage || data.error,
        })
      } else {
        setTranscript(data.text)
        setSttResult({
          success: true,
          model: data.model,
          wasDegraded: data.wasDegraded,
        })
      }
    } catch (err: any) {
      setSttResult({
        success: false,
        error: err.message || 'Transcription failed',
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  // Test Chat/LLM
  const handleGenerateResponse = async () => {
    if (!transcript) return

    setIsGenerating(true)
    setRetryMessage(null)
    setChatResult(null)

    try {
      const response = await fetch('/api/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: 'standard',
          interviewType: 'behavioral',
          conversationHistory: [
            { role: 'candidate', content: transcript }
          ],
        }),
      })

      const data = await response.json()

      if (data.success === false) {
        setChatResult({
          success: false,
          error: data.friendlyMessage || data.error,
        })
      } else {
        setInterviewerResponse(data.response)
        setChatResult({
          success: true,
          model: data.model,
          wasDegraded: data.wasDegraded,
          fallbackMessage: data.degradedMessage,
        })
      }
    } catch (err: any) {
      setChatResult({
        success: false,
        error: err.message || 'Failed to generate response',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Test TTS
  const handleSpeak = async () => {
    if (!interviewerResponse) return

    setIsSynthesizing(true)
    setRetryMessage(null)
    setTtsResult(null)

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: interviewerResponse }),
      })

      const data = await response.json()

      if (data.shouldUseBrowserTTS || data.success === false) {
        // Fall back to browser TTS
        setTtsResult({
          success: true,
          model: 'browser',
          wasDegraded: true,
          fallbackMessage: data.friendlyMessage || 'Using browser voice',
        })
        
        setIsSynthesizing(false)
        setIsSpeaking(true)
        
        speakText(interviewerResponse, {
          onEnd: () => setIsSpeaking(false),
          onError: (err) => {
            setIsSpeaking(false)
            setTtsResult({
              success: false,
              error: err,
            })
          },
        })
      } else if (data.audio) {
        // Play Groq audio
        setTtsResult({
          success: true,
          model: data.model,
          wasDegraded: data.wasDegraded,
        })
        
        setIsSynthesizing(false)
        setIsSpeaking(true)

        // Convert base64 to audio and play
        const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))
        const audioBlob = new Blob([audioData], { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          setIsSpeaking(false)
          // Fallback to browser TTS
          speakText(interviewerResponse, {
            onEnd: () => setIsSpeaking(false),
          })
        }
        
        audio.play()
      }
    } catch (err: any) {
      setIsSynthesizing(false)
      // Fallback to browser TTS
      if (isBrowserTTSSupported()) {
        setTtsResult({
          success: true,
          model: 'browser',
          wasDegraded: true,
          fallbackMessage: 'API failed, using browser voice',
        })
        setIsSpeaking(true)
        speakText(interviewerResponse, {
          onEnd: () => setIsSpeaking(false),
        })
      } else {
        setTtsResult({
          success: false,
          error: err.message || 'Speech synthesis failed',
        })
      }
    }
  }

  const handleStopSpeaking = () => {
    stopSpeaking()
    setIsSpeaking(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Voice Pipeline Test</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshCache}
          disabled={isRefreshing}
          className="border-zinc-700"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-2">Refresh Models</span>
        </Button>
      </div>

      {/* Retry Message */}
      {retryMessage && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {retryMessage}
          </p>
        </div>
      )}

      {/* Step 1: Record & Transcribe */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            1. Record & Transcribe (STT)
            {sttResult?.success && <CheckCircle className="w-4 h-4 text-green-500" />}
            {sttResult?.success === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} className="bg-gradient-primary">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={handleStopAndTranscribe} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop ({duration}s)
              </Button>
            )}
            
            {isTranscribing && (
              <div className="flex items-center text-zinc-400">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transcribing...
              </div>
            )}
          </div>
          
          {recordError && (
            <p className="text-red-400 text-sm">{recordError}</p>
          )}

          {sttResult && (
            <ResultBadge result={sttResult} />
          )}

          {transcript && (
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <p className="text-zinc-300">{transcript}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Generate Interviewer Response */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            2. Generate Response (Chat)
            {chatResult?.success && <CheckCircle className="w-4 h-4 text-green-500" />}
            {chatResult?.success === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerateResponse}
            disabled={!transcript || isGenerating}
            className="bg-gradient-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Generate Interviewer Response
              </>
            )}
          </Button>

          {chatResult && (
            <ResultBadge result={chatResult} />
          )}

          {interviewerResponse && (
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <p className="text-zinc-300">{interviewerResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Text-to-Speech */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            3. Speak Response (TTS)
            {ttsResult?.success && <CheckCircle className="w-4 h-4 text-green-500" />}
            {ttsResult?.success === false && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isSpeaking ? (
              <Button
                onClick={handleSpeak}
                disabled={!interviewerResponse || isSynthesizing}
                className="bg-gradient-primary"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Speak Response
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleStopSpeaking} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop Speaking
              </Button>
            )}
          </div>

          {ttsResult && (
            <ResultBadge result={ttsResult} />
          )}
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Available Models (Ranked)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rankings ? (
            <>
              <ModelList title="Speech-to-Text" models={rankings.stt} />
              <ModelList title="Text-to-Speech" models={rankings.tts} />
              <ModelList title="Chat/LLM" models={rankings.chat.slice(0, 5)} note={rankings.chat.length > 5 ? `+${rankings.chat.length - 5} more` : undefined} />
            </>
          ) : (
            <p className="text-zinc-500">Loading models...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper Components
function ResultBadge({ result }: { result: TestResult }) {
  if (result.success) {
    return (
      <div className={`text-sm p-2 rounded ${result.wasDegraded ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
        <span className="font-medium">Model:</span> {result.model}
        {result.wasDegraded && (
          <span className="ml-2 text-yellow-500">(fallback)</span>
        )}
        {result.fallbackMessage && (
          <p className="mt-1 text-xs opacity-80">{result.fallbackMessage}</p>
        )}
      </div>
    )
  }

  return (
    <div className="text-sm p-2 rounded bg-red-500/10 text-red-400">
      <span className="font-medium">Error:</span> {result.error}
    </div>
  )
}

function ModelList({ title, models, note }: { title: string; models: string[]; note?: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-400 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {models.map((model, i) => (
          <span
            key={model}
            className={`px-2 py-1 text-xs rounded ${
              i === 0 
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {i === 0 && '★ '}
            {model}
          </span>
        ))}
        {note && <span className="px-2 py-1 text-xs text-zinc-500">{note}</span>}
      </div>
    </div>
  )
}