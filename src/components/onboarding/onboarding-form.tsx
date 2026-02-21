'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  Code,
  Palette,
  Server,
  Layers,
  Database,
  Rocket,
  Zap,
  Calendar,
  Compass,
} from 'lucide-react'

const roleOptions = [
  { value: 'software_engineer', label: 'Software Engineer', icon: Code },
  { value: 'frontend', label: 'Frontend Developer', icon: Palette },
  { value: 'backend', label: 'Backend Developer', icon: Server },
  { value: 'fullstack', label: 'Full Stack Developer', icon: Layers },
  { value: 'data', label: 'Data / ML Engineer', icon: Database },
  { value: 'other', label: 'Other Tech Role', icon: Rocket },
]

const timelineOptions = [
  {
    value: 'this_week',
    label: 'This week',
    description: 'Intensive preparation',
    icon: Zap,
  },
  {
    value: '2_4_weeks',
    label: '2-4 weeks',
    description: 'Steady practice',
    icon: Calendar,
  },
  {
    value: 'exploring',
    label: 'Just exploring',
    description: 'No rush',
    icon: Compass,
  },
]

interface OnboardingFormProps {
  userId: string
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const [targetRole, setTargetRole] = useState('')
  const [timeline, setTimeline] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!targetRole || !timeline) {
      toast.error('Please select both options')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, timeline }),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success('Setup complete')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <CardContent className="space-y-8 pt-6">
        {/* Role Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">
            What role are you preparing for?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTargetRole(option.value)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    targetRole === option.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                  }`}
                >
                  <Icon
                    className={`mb-2 h-5 w-5 ${
                      targetRole === option.value
                        ? 'text-violet-400'
                        : 'text-zinc-400'
                    }`}
                  />
                  <p className="text-sm font-medium text-white">
                    {option.label}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Timeline Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">
            When is your interview?
          </label>
          <div className="space-y-2">
            {timelineOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTimeline(option.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    timeline === option.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 ${
                        timeline === option.value
                          ? 'text-violet-400'
                          : 'text-zinc-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {option.label}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!targetRole || !timeline || loading}
          className="bg-gradient-primary h-11 w-full transition-opacity hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
