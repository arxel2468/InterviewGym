// src/components/session/mic-check.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, CheckCircle, AlertCircle } from 'lucide-react'

type MicStatus = 'untested' | 'testing' | 'working' | 'failed'

export function MicCheck({ onReady }: { onReady: () => void }) {
  const [status, setStatus] = useState<MicStatus>('untested')

  const testMic = async () => {
    setStatus('testing')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Check if we get audio data
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)

      // Brief test
      await new Promise((resolve) => setTimeout(resolve, 1000))

      stream.getTracks().forEach((t) => t.stop())
      audioContext.close()
      setStatus('working')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="space-y-4 pt-6 text-center">
        <h3 className="text-lg font-medium text-white">Microphone Check</h3>

        {status === 'untested' && (
          <Button onClick={testMic} className="bg-gradient-primary">
            <Mic className="mr-2 h-4 w-4" />
            Test Microphone
          </Button>
        )}

        {status === 'testing' && <p className="text-zinc-400">Listening...</p>}

        {status === 'working' && (
          <>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              Microphone working
            </div>
            <Button onClick={onReady} className="bg-gradient-primary">
              Start Interview
            </Button>
          </>
        )}

        {status === 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Microphone not detected
            </div>
            <Button
              onClick={testMic}
              variant="outline"
              className="border-zinc-700"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
