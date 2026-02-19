import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, TrendingUp, Calendar, Clock, ArrowRight } from 'lucide-react'


export default async function DashboardPage() {
  const user = await requireAuth()

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
        <Card className="bg-violet-500/10 border-violet-500/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">You have an interview in progress</p>
                <p className="text-sm text-zinc-400">
                  Started {formatTimeAgo(activeSession.startedAt)}
                </p>
              </div>
              <Link href={`/dashboard/session/${activeSession.id}`}>
                <Button className="bg-gradient-primary hover:opacity-90">
                  Resume Session
                  <ArrowRight className="w-4 h-4 ml-2" />
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
          <p className="text-zinc-400 mt-1">
            Ready to practice?
          </p>
        </div>
        <Link href="/dashboard/session/new">
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Sessions</p>
                <p className="text-2xl font-semibold text-white mt-1">{user.totalSessions}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Current Streak</p>
                <p className="text-2xl font-semibold text-white mt-1">
                  {user.currentStreak} {user.currentStreak > 0 && <span className="text-sm text-zinc-500">days</span>}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Best Streak</p>
                <p className="text-2xl font-semibold text-white mt-1">
                  {user.longestStreak} {user.longestStreak > 0 && <span className="text-sm text-zinc-500">days</span>}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Last Session</p>
                <p className="text-lg font-medium text-white mt-1">
                  {user.lastSessionAt
                    ? new Date(user.lastSessionAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">Recent Sessions</CardTitle>
            {recentSessions.length > 0 && (
              <Link href="/dashboard/history" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View all
                <ArrowRight className="w-3 h-3" />
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
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-800/50 transition-colors">
                    <div>
                      <p className="text-white font-medium capitalize text-sm">
                        {session.interviewType.replace('_', ' ')} Interview
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {session.completedAt
                          ? new Date(session.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })
                          : 'In progress'}
                        <span className="mx-1.5">·</span>
                        <span className="capitalize">{session.difficulty}</span>
                      </p>
                    </div>
                    {session.metrics?.overallScore && (
                      <div className="text-right">
                        <p className="text-xl font-semibold text-violet-400">
                          {session.metrics.overallScore}<span className="text-sm text-zinc-500">/10</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-400 mb-4">No sessions yet</p>
              <Link href="/dashboard/session/new">
                <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
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
