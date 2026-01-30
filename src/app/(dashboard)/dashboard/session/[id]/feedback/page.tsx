import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { FeedbackView } from '@/components/session/feedback-view'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FeedbackPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()

  const session = await prisma.session.findUnique({
    where: {
      id: id,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: { orderIndex: 'asc' },
      },
      metrics: true,
      feedback: true,
    },
  })

  if (!session) {
    notFound()
  }

  // Session exists but not completed
  if (session.status !== 'completed') {
    redirect(`/dashboard/session/${session.id}`)
  }

  // Session completed but feedback failed to generate
  if (!session.feedback) {
    return (
      <div className="max-w-xl mx-auto mt-20">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              Feedback Generation Failed
            </h2>

            <p className="text-zinc-400 mb-6">
              We completed your interview but couldn't generate feedback.
              Your session has been saved.
            </p>

            <div className="flex justify-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/session/new">
                <Button className="bg-gradient-primary">
                  Try Another Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <FeedbackView 
      session={session}
      messages={session.messages}
      metrics={session.metrics}
      feedback={session.feedback}
    />
  )
}
