import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, TrendingUp, Calendar, Clock, ArrowRight } from 'lucide-react'
import { getUserPlan } from '@/lib/subscription'

export default async function DashboardPage() {
  const user = await requireAuth()

  const userPlan = await getUserPlan(user.id)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sessionsToday = await prisma.session.count({
    where: {
      userId: user.id,
      createdAt: { gte: today, lt: tomorrow },
    },
  })

  const sessionsRemaining = Math.max(0, userPlan.sessionsPerDay - sessionsToday)

  if (!user.onboardingComplete) {
    redirect('/onboarding')
  }

  // Check for any active session (started within threshold)
  const activeSession = await prisma.session.findFirst({
    where: {
      userId: user.id,
      status: 'in_progress',
    },
    orderBy: { startedAt: 'desc' },
  })

  const recentSessions = await prisma.session.findMany({
    where: { userId: user.id, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    take: 5,
    include: { metrics: true },
  })

  return (
    <div className="space-y-8">
      {/* Active Session Banner */}
      {activeSession && (
        <Card className="border-violet-500/30 bg-violet-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">
                  You have an interview in progress
                </p>
                <p className="text-sm text-zinc-400">
                  Started {formatTimeAgo(activeSession.startedAt)}
                </p>
              </div>
              <Link href={`/dashboard/session/${activeSession.id}`}>
                <Button className="bg-gradient-primary hover:opacity-90">
                  Resume Session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-zinc-400">Ready to practice?</p>
        </div>
        <Link href="/dashboard/session/new">
          <Button className="bg-gradient-primary transition-opacity hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {/* User Plan */}
      {userPlan.plan === 'free' && (
        <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-blue-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">
                  Free Plan — {sessionsRemaining} of {userPlan.sessionsPerDay}{' '}
                  sessions left today
                </p>
                <p className="text-sm text-zinc-400">
                  Upgrade for more sessions and all interview types
                </p>
              </div>
              <Link href="/pricing">
                <Button
                  size="sm"
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Upgrade
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Sessions</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {user.totalSessions}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <TrendingUp className="h-5 w-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Current Streak</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {user.currentStreak}{' '}
                  {user.currentStreak > 0 && (
                    <span className="text-sm text-zinc-500">days</span>
                  )}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Best Streak</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {user.longestStreak}{' '}
                  {user.longestStreak > 0 && (
                    <span className="text-sm text-zinc-500">days</span>
                  )}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Last Session</p>
                <p className="mt-1 text-lg font-medium text-white">
                  {user.lastSessionAt
                    ? new Date(user.lastSessionAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Never'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                <Clock className="h-5 w-5 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">
              Recent Sessions
            </CardTitle>
            {recentSessions.length > 0 && (
              <Link
                href="/dashboard/history"
                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/dashboard/session/${session.id}/feedback`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-800/30 p-4 transition-colors hover:bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-medium capitalize text-white">
                        {session.interviewType.replace('_', ' ')} Interview
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {session.completedAt
                          ? new Date(session.completedAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              }
                            )
                          : 'In progress'}
                        <span className="mx-1.5">·</span>
                        <span className="capitalize">{session.difficulty}</span>
                      </p>
                    </div>
                    {session.metrics?.overallScore && (
                      <div className="text-right">
                        <p className="text-xl font-semibold text-violet-400">
                          {session.metrics.overallScore}
                          <span className="text-sm text-zinc-500">/10</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <Plus className="h-6 w-6 text-zinc-500" />
              </div>
              <p className="mb-4 text-zinc-400">No sessions yet</p>
              <Link href="/dashboard/session/new">
                <Button
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Start your first session
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function for time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}
