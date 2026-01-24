import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { parseResume } from '@/lib/groq/resume-parser'
import { z } from 'zod'

const schema = z.object({
  text: z.string().min(50, 'Resume text too short').max(15000, 'Resume text too long'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text } = schema.parse(body)

    // Parse resume with AI
    const parsedData = await parseResume(text)

    // Delete existing resume if any
    await prisma.resume.deleteMany({
      where: { userId: user.id },
    })

    // Save only parsed data
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: '',
        fileName: 'Pasted resume',
        rawText: null,
        parsedData,
      },
    })

    return NextResponse.json({ resume, parsed: parsedData })
  } catch (error: any) {
    console.error('Parse resume error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
