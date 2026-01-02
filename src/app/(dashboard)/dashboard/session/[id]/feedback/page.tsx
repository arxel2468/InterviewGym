import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FeedbackView } from '@/components/session/feedback-view'

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

  if (!session || !session.feedback) {
    notFound()
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