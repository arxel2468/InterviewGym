import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Plus,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

export default async function HistoryPage() {
  const user = await requireAuth()

  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      status: 'completed',
    },
    orderBy: { completedAt: 'desc' },
    include: {
      metrics: true,
    },
  })

  // Calculate stats
  const totalSessions = sessions.length
  const averageScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.metrics?.overallScore || 0), 0) /
            sessions.length
        )
      : 0
  const totalPracticeTime = sessions.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  )
  const bestScore =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.metrics?.overallScore || 0))
      : 0

  // Group sessions by month
  const sessionsByMonth = sessions.reduce(
    (acc, session) => {
      const date = session.completedAt
        ? new Date(session.completedAt)
        : new Date(session.createdAt)
      const monthKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })

      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(session)
      return acc
    },
    {} as Record<string, typeof sessions>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Training History
          </h1>
          <p className="mt-1 text-zinc-400">Track your progress over time</p>
        </div>
        <Link href="/dashboard/session/new">
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Total Sessions"
          value={totalSessions.toString()}
          color="violet"
        />
        <StatCard
          icon={Target}
          label="Average Score"
          value={`${averageScore}/10`}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Best Score"
          value={`${bestScore}/10`}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Practice Time"
          value={formatTotalTime(totalPracticeTime)}
          color="amber"
        />
      </div>

      {/* Sessions List */}
      {totalSessions > 0 ? (
        <div className="space-y-8">
          {Object.entries(sessionsByMonth).map(([month, monthSessions]) => (
            <div key={month}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Calendar className="h-4 w-4" />
                {month}
              </h2>
              <div className="space-y-3">
                {monthSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <MessageSquare className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-white">
              No sessions yet
            </h3>
            <p className="mb-6 text-zinc-400">
              Complete your first practice session to see your history here.
            </p>
            <Link href="/dashboard/session/new">
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Start Your First Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper: Format total time
function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

// Helper: Format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Component: Stat Card
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: 'violet' | 'blue' | 'green' | 'amber'
}) {
  const colorClasses = {
    violet: 'bg-violet-500/10 text-violet-400',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Component: Session Card
function SessionCard({
  session,
}: {
  session: {
    id: string
    interviewType: string
    difficulty: string
    durationSeconds: number | null
    completedAt: Date | null
    createdAt: Date
    metrics: {
      overallScore: number | null
      questionsAnswered: number
    } | null
  }
}) {
  const date = session.completedAt
    ? new Date(session.completedAt)
    : new Date(session.createdAt)
  const score = session.metrics?.overallScore || 0

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-violet-400'
    if (score >= 4) return 'text-amber-400'
    return 'text-red-400'
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      warmup: 'bg-green-500/10 text-green-400 border-green-500/20',
      standard: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      intense: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return colors[difficulty] || colors.standard
  }

  return (
    <Link href={`/dashboard/session/${session.id}/feedback`}>
      <Card className="cursor-pointer border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Score */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800">
                <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>

              {/* Details */}
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-medium capitalize text-white">
                    {session.interviewType.replace('_', ' ')} Interview
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs capitalize ${getDifficultyBadge(session.difficulty)}`}
                  >
                    {session.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  {session.durationSeconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.durationSeconds)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {session.metrics?.questionsAnswered || 0} responses
                  </span>
                </div>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-zinc-600" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
