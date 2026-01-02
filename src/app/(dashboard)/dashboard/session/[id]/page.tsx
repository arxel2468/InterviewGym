import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { InterviewSession } from '@/components/session/interview-session'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()
  
  console.log('Loading session:', id, 'for user:', user.id)
  
  const session = await prisma.session.findUnique({
    where: { 
      id: id,
      userId: user.id,
    },
  })

  console.log('Session found:', session)

  if (!session) {
    console.log('Session not found, returning 404')
    notFound()
  }

  // If session is already completed, redirect to feedback
  if (session.status === 'completed') {
    redirect(`/dashboard/session/${session.id}/feedback`)
  }

  return (
    <InterviewSession 
      sessionId={session.id}
      difficulty={session.difficulty as 'warmup' | 'standard' | 'intense'}
      interviewType={session.interviewType}
    />
  )
}