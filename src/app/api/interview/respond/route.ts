import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateInterviewerResponse, Difficulty } from '@/lib/groq/interviewer'
import { formatResumeForContext, ParsedResume } from '@/lib/groq/resume-parser'
import { z } from 'zod'

const requestSchema = z.object({
  sessionId: z.string().optional(),
  difficulty: z.enum(['warmup', 'standard', 'intense']),
  interviewType: z.string(),
  targetRole: z.string().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['interviewer', 'candidate']),
      content: z.string(),
    })
  ),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const context = requestSchema.parse(body)

    // Get resume context if session uses resume
    let resumeContext: string | undefined

    if (context.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: context.sessionId, userId: user.id },
      })

      if (session?.usedResume) {
        const resume = await prisma.resume.findUnique({
          where: { userId: user.id },
        })

        if (resume?.parsedData) {
          resumeContext = formatResumeForContext(resume.parsedData as ParsedResume)
        }
      }
    }

    const result = await generateInterviewerResponse({
      difficulty: context.difficulty as Difficulty,
      interviewType: context.interviewType,
      targetRole: context.targetRole,
      resumeContext,
      conversationHistory: context.conversationHistory,
    })

    if ('success' in result && result.success === false) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Interview response error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate response',
        friendlyMessage: "The interviewer is stuck in another meeting. Please try again."
      },
      { status: 500 }
    )
  }
}
