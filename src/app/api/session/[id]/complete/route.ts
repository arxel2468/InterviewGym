import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateFeedback, Difficulty } from '@/lib/groq/interviewer'
import { analyzeText, estimatePauses } from '@/lib/utils/metrics'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const completeSessionSchema = z.object({
  conversationHistory: z.array(
    z.object({
      role: z.enum(['interviewer', 'candidate']),
      content: z.string(),
      durationMs: z.number(),
    })
  ),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { conversationHistory } = completeSessionSchema.parse(body)

    // Get session
    const session = await prisma.session.findUnique({
      where: { id, userId: user.id },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    // Analyze candidate messages
    const candidateMessages = conversationHistory.filter((m) => m.role === 'candidate')

    // Aggregate metrics
    let totalFillerWords = 0
    let totalPauses = 0
    let totalWordCount = 0
    let longestPauseMs = 0

    const messageAnalyses = candidateMessages.map((msg) => {
      const analysis = analyzeText(msg.content)
      const pauses = estimatePauses(msg.content)

      totalFillerWords += analysis.fillerWordCount
      totalPauses += pauses
      totalWordCount += analysis.wordCount

      if (msg.durationMs > longestPauseMs) {
        longestPauseMs = msg.durationMs
      }

      return {
        content: msg.content,
        ...analysis,
        pauses,
        durationMs: msg.durationMs,
      }
    })

    // Save messages with analysis
    await prisma.message.createMany({
      data: conversationHistory.map((msg, index) => {
        const analysis = messageAnalyses.find(a => a.content === msg.content)

        return {
          sessionId: id,
          role: msg.role,
          content: msg.content,
          durationMs: msg.durationMs,
          orderIndex: index,
          fillerWordCount: msg.role === 'candidate' ? (analysis?.fillerWordCount ?? 0) : null,
          pauseCount: msg.role === 'candidate' ? (analysis?.pauses ?? 0) : null,
          wordCount: msg.role === 'candidate' ? (analysis?.wordCount ?? 0) : null,
          longestPauseMs: null,
        }
      }),
    })

    // Generate AI feedback
    const feedbackResult = await generateFeedback(
      conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      session.difficulty as Difficulty
    )

    // Handle feedback generation failure
    const feedback = 'success' in feedbackResult && feedbackResult.success === false
      ? {
          strengths: ['Session completed'],
          improvements: ['Unable to generate detailed analysis'],
          suggestions: ['Try another session for feedback'],
          overallScore: 5,
          clarityScore: 5,
          structureScore: 5,
          relevanceScore: 5,
          confidenceScore: 5,
          summary: 'We had trouble analyzing this session. Your responses were recorded.',
        }
      : feedbackResult as {
          strengths: string[]
          improvements: string[]
          suggestions: string[]
          overallScore: number
          clarityScore: number
          structureScore: number
          relevanceScore: number
          confidenceScore: number
          summary: string
        }

    // Calculate timing metrics
    const totalDuration = conversationHistory.reduce((sum, m) => sum + m.durationMs, 0)
    const averageResponseMs = candidateMessages.length > 0
      ? Math.round(candidateMessages.reduce((sum, m) => sum + m.durationMs, 0) / candidateMessages.length)
      : 0

    // Save metrics
    await prisma.metrics.create({
      data: {
        sessionId: id,
        questionsAnswered: candidateMessages.length,
        averageResponseMs,
        totalWordCount,
        totalFillerWords,
        totalPauses,
        longestPauseMs,
        clarityScore: feedback.clarityScore,
        structureScore: feedback.structureScore,
        relevanceScore: feedback.relevanceScore,
        confidenceScore: feedback.confidenceScore,
        overallScore: feedback.overallScore,
      },
    })

    // Save feedback
    await prisma.feedback.create({
      data: {
        sessionId: id,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        suggestions: feedback.suggestions,
        summary: feedback.summary,
      },
    })

    // Update session status
    const completedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        durationSeconds: Math.round(totalDuration / 1000),
      },
    })

    // Update user stats
    await updateUserStats(user.id)

    return NextResponse.json({
      session: completedSession,
      feedback,
      metrics: {
        totalFillerWords,
        totalPauses,
        totalWordCount,
        averageResponseMs,
      },
    })
  } catch (error) {
    logger.error('Complete session error', { error: String(error) })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    )
  }
}

async function updateUserStats(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!dbUser) return

  const lastSession = dbUser.lastSessionAt
  let newStreak = dbUser.currentStreak

  if (lastSession) {
    const lastSessionDate = new Date(lastSession)
    lastSessionDate.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (lastSessionDate.getTime() === yesterday.getTime()) {
      newStreak = dbUser.currentStreak + 1
    } else if (lastSessionDate.getTime() < yesterday.getTime()) {
      newStreak = 1
    }
  } else {
    newStreak = 1
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalSessions: { increment: 1 },
      lastSessionAt: new Date(),
      currentStreak: newStreak,
      longestStreak: Math.max(dbUser.longestStreak, newStreak),
    },
  })
}
