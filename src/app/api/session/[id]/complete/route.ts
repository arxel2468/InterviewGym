import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateFeedback, Difficulty } from '@/lib/groq/interviewer'
import { z } from 'zod'

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { conversationHistory } = completeSessionSchema.parse(body)

    // Get session
    const session = await prisma.session.findUnique({
      where: { id, userId: user.id },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Save messages
    await prisma.message.createMany({
      data: conversationHistory.map((msg, index) => ({
        sessionId: id,
        role: msg.role,
        content: msg.content,
        durationMs: msg.durationMs,
        orderIndex: index,
      })),
    })

    // Generate feedback
    const feedbackResult = await generateFeedback(
      conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      session.difficulty as Difficulty
    )

    // Check if feedback generation failed
    if ('success' in feedbackResult && feedbackResult.success === false) {
      console.error('Feedback generation failed:', feedbackResult)
      // Continue with default values
    }

    const feedback = 'success' in feedbackResult ? {
      strengths: ['Unable to analyze'],
      improvements: ['Unable to analyze'],
      suggestions: ['Try another session'],
      overallScore: 5,
      clarityScore: 5,
      structureScore: 5,
      relevanceScore: 5,
      summary: 'We had trouble analyzing this session.',
    } : feedbackResult

    // Calculate metrics
    const candidateMessages = conversationHistory.filter((m) => m.role === 'candidate')
    const totalDuration = conversationHistory.reduce((sum, m) => sum + m.durationMs, 0)
    
    // Save metrics
    await prisma.metrics.create({
      data: {
        sessionId: id,
        questionsAnswered: candidateMessages.length,
        averageResponseMs: candidateMessages.length > 0 
          ? Math.round(candidateMessages.reduce((sum, m) => sum + m.durationMs, 0) / candidateMessages.length)
          : 0,
        totalWordCount: candidateMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0),
        clarityScore: feedback.clarityScore,
        structureScore: feedback.structureScore,
        relevanceScore: feedback.relevanceScore,
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

    // Update session
    const completedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        durationSeconds: Math.round(totalDuration / 1000),
      },
    })

    // Update user stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (dbUser) {
      const lastSession = dbUser.lastSessionAt
      let newStreak = dbUser.currentStreak

      if (lastSession) {
        const lastSessionDate = new Date(lastSession)
        lastSessionDate.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (lastSessionDate.getTime() === yesterday.getTime()) {
          // Consecutive day
          newStreak = dbUser.currentStreak + 1
        } else if (lastSessionDate.getTime() < yesterday.getTime()) {
          // Streak broken
          newStreak = 1
        }
        // Same day - no change
      } else {
        // First session
        newStreak = 1
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalSessions: { increment: 1 },
          lastSessionAt: new Date(),
          currentStreak: newStreak,
          longestStreak: Math.max(dbUser.longestStreak, newStreak),
        },
      })
    }

    return NextResponse.json({ 
      session: completedSession,
      feedback,
    })
  } catch (error) {
    console.error('Complete session error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    )
  }
}