'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Loader2, 
  Smile, 
  Briefcase, 
  Flame,
  MessageSquare,
  ArrowRight
} from 'lucide-react'

type Difficulty = 'warmup' | 'standard' | 'intense'
type InterviewType = 'behavioral'

const DIFFICULTIES: {
  value: Difficulty
  label: string
  description: string
  icon: typeof Smile
}[] = [
  {
    value: 'warmup',
    label: 'Warm-up',
    description: 'Friendly and encouraging. Great for building confidence.',
    icon: Smile,
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Professional and neutral. Like a real interview.',
    icon: Briefcase,
  },
  {
    value: 'intense',
    label: 'Intense',
    description: 'Challenging and rigorous. Prepare for tough follow-ups.',
    icon: Flame,
  },
]

const INTERVIEW_TYPES: {
  value: InterviewType
  label: string
  description: string
  icon: typeof MessageSquare
}[] = [
  {
    value: 'behavioral',
    label: 'Behavioral Interview',
    description: '"Tell me about a time when..." — Practice storytelling and STAR method.',
    icon: MessageSquare,
  },
]

interface SessionSetupFormProps {
  targetRole?: string
  hasResume: boolean
}

export function SessionSetupForm({ targetRole, hasResume }: SessionSetupFormProps) {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>('standard')
  const [interviewType, setInterviewType] = useState<InterviewType>('behavioral')
  const [useResume, setUseResume] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty,
          interviewType,
          useResume,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const { session } = await response.json()
      router.push(`/dashboard/session/${session.id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
      toast.error('Failed to start session. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Interview Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">
          Interview Type
        </label>
        <div className="space-y-3">
          {INTERVIEW_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = interviewType === type.value
            return (
              <button
                key={type.value}
                onClick={() => setInterviewType(type.value)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-violet-500/20' : 'bg-zinc-800'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-400' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{type.label}</p>
                    <p className="text-sm text-zinc-400 mt-0.5">{type.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">
          Difficulty
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIFFICULTIES.map((diff) => {
            const Icon = diff.icon
            const isSelected = difficulty === diff.value
            return (
              <button
                key={diff.value}
                onClick={() => setDifficulty(diff.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-violet-400' : 'text-zinc-400'}`} />
                <p className="font-medium text-white">{diff.label}</p>
                <p className="text-xs text-zinc-500 mt-1">{diff.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Resume Option */}
      {hasResume && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useResume}
                onChange={(e) => setUseResume(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500"
              />
              <div>
                <p className="text-white font-medium">Use my resume</p>
                <p className="text-sm text-zinc-400">
                  The interviewer will ask about your specific experience
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Context Info */}
      {targetRole && (
        <p className="text-sm text-zinc-500">
          Preparing for: <span className="text-zinc-300 capitalize">{targetRole.replace('_', ' ')}</span>
        </p>
      )}

      {/* Interview Info */}
      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
        <p className="text-sm text-zinc-300">
          <strong>What to expect:</strong>
        </p>
        <ul className="text-sm text-zinc-400 mt-2 space-y-1">
          <li>• 5-6 behavioral questions covering different topics</li>
          <li>• Follow-up questions to probe deeper</li>
          <li>• About 10-15 minutes total</li>
          <li>• Detailed feedback at the end</li>
        </ul>
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            Begin Session
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
