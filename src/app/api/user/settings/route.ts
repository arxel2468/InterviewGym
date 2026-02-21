import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
  targetRole: z.string().optional(),
  interviewTimeline: z.string().optional(),
})

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = settingsSchema.parse(body)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        targetRole: data.targetRole,
        interviewTimeline: data.interviewTimeline,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
