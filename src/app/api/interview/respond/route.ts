import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateInterviewerResponse, Difficulty } from '@/lib/groq/interviewer'
import { formatResumeForContext, ParsedResume } from '@/lib/groq/resume-parser'
import { z } from 'zod'
import { logger } from '@/lib/logger'

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

    // Parse body with error handling
    let body
    try {
      const text = await request.text()
      if (!text) {
        return NextResponse.json({
          success: false,
          error: 'Empty request body',
          friendlyMessage: 'Something went wrong. Please try again.'
        }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      logger.error('JSON parse error:',  { error: String(parseError) })
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        friendlyMessage: 'Something went wrong. Please try again.'
      }, { status: 400 })
    }

    const context = requestSchema.parse(body)

    // Get resume context if session uses resume
    let resumeContext: string | undefined

    if (context.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: context.sessionId, userId: user.id },
      })

      logger.info('Session usedResume:',  { usedResume: session?.usedResume })

      if (session?.usedResume) {
        const resume = await prisma.resume.findUnique({
          where: { userId: user.id },
        })

        logger.info('Resume found:', { hasResume: !!resume, hasParsedData: !!resume?.parsedData })

        if (resume?.parsedData) {
          resumeContext = formatResumeForContext(resume.parsedData as ParsedResume)
          logger.info('Resume context generated:', { preview: resumeContext?.substring(0, 200) })
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
    logger.error('Interview response error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        friendlyMessage: 'Something went wrong. Please try again.'
      }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate response',
        friendlyMessage: "The interviewer is having trouble. Please try again."
      },
      { status: 500 }
    )
  }
}
