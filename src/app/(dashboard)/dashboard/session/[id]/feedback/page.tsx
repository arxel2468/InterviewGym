import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { FeedbackView } from '@/components/session/feedback-view'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'
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
      <div className="mx-auto mt-20 max-w-xl">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="pb-8 pt-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-white">
              Feedback Generation Failed
            </h2>

            <p className="mb-6 text-zinc-400">
              We completed your interview but couldn't generate feedback. Your
              session has been saved.
            </p>

            <div className="flex justify-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" className="border-zinc-700">
                  <Home className="mr-2 h-4 w-4" />
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
