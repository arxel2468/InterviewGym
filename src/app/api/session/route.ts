import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@lib/rate-limit'
import { z } from 'zod'

const createSessionSchema = z.object({
  interviewType: z.enum(['behavioral', 'technical', 'hr_screen', 'system_design']),
  difficulty: z.enum(['warmup', 'standard', 'intense']),
  targetRole: z.string().optional(),
  useResume: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(user.id)

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Daily limit reached',
        message: `You've used all ${10} sessions for today. Come back tomorrow!`,
        resetAt: rateLimit.resetAt,
      }, { status: 429 })
    }

    const body = await request.json()
    const { interviewType, difficulty, targetRole, useResume } = createSessionSchema.parse(body)

    // Check for existing in-progress session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        status: 'in_progress',
      },
    })

    if (existingSession) {
      return NextResponse.json({
        session: existingSession,
        resumed: true,
      })
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        interviewType,
        difficulty,
        targetRole,
        usedResume: useResume || false,
        status: 'in_progress',
      },
    })

    // Store target role in user profile if changed
    if (targetRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { targetRole },
      })
    }

    return NextResponse.json({ session, resumed: false })
  } catch (error) {
    console.error('Create session error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
