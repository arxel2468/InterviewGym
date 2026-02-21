import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.session.updateMany({
      where: {
        id,
        userId: user.id,
        status: 'in_progress',
      },
      data: {
        status: 'abandoned',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Abandon session error:', error)
    return NextResponse.json(
      { error: 'Failed to abandon session' },
      { status: 500 }
    )
  }
}
