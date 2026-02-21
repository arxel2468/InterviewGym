'use client'

import { useEffect, useState } from 'react'
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
  Code,
  Users,
  Boxes,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'
import { INTERVIEW_CONFIGS, InterviewType, TargetRole } from '@/lib/questions'

type Difficulty = 'warmup' | 'standard' | 'intense'

const DIFFICULTIES: {
  value: Difficulty
  label: string
  description: string
  icon: typeof Smile
}[] = [
  {
    value: 'warmup',
    label: 'Warm-up',
    description: 'Friendly and encouraging',
    icon: Smile,
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Professional and neutral',
    icon: Briefcase,
  },
  {
    value: 'intense',
    label: 'Intense',
    description: 'Challenging and rigorous',
    icon: Flame,
  },
]

const INTERVIEW_TYPES: {
  value: InterviewType
  label: string
  description: string
  icon: typeof MessageSquare
  duration: string
}[] = [
  {
    value: 'behavioral',
    label: 'Behavioral',
    description: '"Tell me about a time when..." — STAR format practice',
    icon: MessageSquare,
    duration: '~15 min',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Conceptual questions about your tech stack',
    icon: Code,
    duration: '~20 min',
  },
  {
    value: 'hr_screen',
    label: 'HR Screen',
    description: 'Motivation, salary expectations, availability',
    icon: Users,
    duration: '~15 min',
  },
  {
    value: 'system_design',
    label: 'System Design',
    description: 'Design systems and discuss trade-offs',
    icon: Boxes,
    duration: '~25 min',
  },
]

const ROLES: {
  value: TargetRole
  label: string
}[] = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Full Stack Developer' },
  { value: 'data', label: 'Data Engineer / Scientist' },
  { value: 'devops', label: 'DevOps / SRE' },
  { value: 'mobile', label: 'Mobile Developer' },
  { value: 'product', label: 'Product Manager' },
  { value: 'general', label: 'Other / General' },
]

interface SessionSetupFormProps {
  targetRole?: string
  hasResume: boolean
}

export function SessionSetupForm({
  targetRole,
  hasResume,
}: SessionSetupFormProps) {
  const router = useRouter()
  const [interviewType, setInterviewType] =
    useState<InterviewType>('behavioral')
  const [role, setRole] = useState<TargetRole>(
    (targetRole as TargetRole) || 'fullstack'
  )
  const [difficulty, setDifficulty] = useState<Difficulty>('standard')
  const [useResume, setUseResume] = useState(hasResume)
  const [isLoading, setIsLoading] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('free')

  useEffect(() => {
    fetch('/api/user/plan')
      .then((res) => res.json())
      .then((data) => setUserPlan(data.plan))
      .catch(() => setUserPlan('free'))
  }, [])

  // The interview type buttons, add lock:
  const isLocked = (type: string) => {
    if (userPlan === 'free' && type !== 'behavioral') return true
    return false
  }

  // Only show role selection for technical interviews
  const showRoleSelection =
    interviewType === 'technical' || interviewType === 'system_design'

  const handleStart = async () => {
    if (isLoading) return // Guard
    setIsLoading(true)

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          difficulty,
          targetRole: role,
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
      toast.error('Failed to start session')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Interview Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">
          Interview Type
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTERVIEW_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = interviewType === type.value
            return (
              <button
                key={type.value}
                onClick={() =>
                  !isLocked(type.value) && setInterviewType(type.value)
                }
                className={`rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                } ${
                  isLocked(type.value) ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2 ${isSelected ? 'bg-violet-500/20' : 'bg-zinc-800'}`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isSelected ? 'text-violet-400' : 'text-zinc-400'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">
                        {type.label}
                      </p>
                      <span className="text-xs text-zinc-500">
                        {type.duration}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {type.description}
                    </p>
                  </div>
                </div>
                {isLocked(type.value) && (
                  <span className="mt-1 text-xs text-violet-400">
                    Student plan
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Role Selection (for technical interviews) */}
      {/* Role Selection - Always Show */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">
          Target Role
          {interviewType === 'technical' && (
            <span className="ml-2 text-xs text-violet-400">
              (affects question topics)
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ROLES.map((r) => {
            const isSelected = role === r.value
            return (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`rounded-lg border p-3 text-center transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <p
                  className={`text-sm ${isSelected ? 'text-white' : 'text-zinc-400'}`}
                >
                  {r.label}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">Difficulty</label>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((diff) => {
            const Icon = diff.icon
            const isSelected = difficulty === diff.value
            return (
              <button
                key={diff.value}
                onClick={() => setDifficulty(diff.value)}
                className={`rounded-lg border p-4 text-center transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <Icon
                  className={`mx-auto mb-2 h-5 w-5 ${isSelected ? 'text-violet-400' : 'text-zinc-400'}`}
                />
                <p className="text-sm font-medium text-white">{diff.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{diff.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Resume Toggle */}
      {hasResume && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={useResume}
                onChange={(e) => setUseResume(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500"
              />
              <div>
                <p className="text-sm font-medium text-white">Use my resume</p>
                <p className="text-xs text-zinc-400">
                  Questions will reference your experience
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-400" />
          <div className="text-sm text-zinc-400">
            <p className="mb-1 font-medium text-zinc-300">What to expect</p>
            <ul className="space-y-1 text-xs">
              <li>
                • {INTERVIEW_CONFIGS[interviewType].questionCount} questions
                covering different topics
              </li>
              <li>• Follow-up questions based on your answers</li>
              <li>• Detailed feedback at the end</li>
              <li>
                • Approximately{' '}
                {INTERVIEW_CONFIGS[interviewType].durationMinutes} minutes
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={isLoading}
        className="bg-gradient-primary h-12 w-full text-lg hover:opacity-90"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            Begin Interview
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  )
}
