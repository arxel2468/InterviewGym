import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSessionSchema = z.object({
  interviewType: z.string(),
  difficulty: z.enum(['warmup', 'standard', 'intense']),
  useResume: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { interviewType, difficulty, useResume } = createSessionSchema.parse(body)

    // Check for existing in-progress session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        status: 'in_progress',
      },
    })

    if (existingSession) {
      // Return the existing session instead of creating a new one
      return NextResponse.json({
        session: existingSession,
        resumed: true,
      })
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        interviewType,
        difficulty,
        usedResume: useResume || false,
        status: 'in_progress',
      },
    })

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
