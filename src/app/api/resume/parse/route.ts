import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { parseResume } from '@/lib/groq/resume-parser'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  text: z.string().min(100, 'Resume text too short - please paste more content').max(20000, 'Resume text too long'),
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

    logger.info('Parsing pasted resume, length:', text.length)
    logger.info('First 500 chars:', text.substring(0, 500))

    // Parse resume with AI
    const parsedData = await parseResume(text)

    logger.info('Parsed result:', {
      name: parsedData.name,
      skills: parsedData.skills?.length || 0,
      experience: parsedData.experience?.length || 0,
      projects: parsedData.projects?.length || 0,
      education: parsedData.education?.length || 0,
    })

    // Validate we got something useful
    if (
      parsedData.skills.length === 0 &&
      parsedData.experience.length === 0 &&
      parsedData.projects.length === 0
    ) {
      return NextResponse.json({
        error: 'Could not extract any information. Please ensure you pasted your full resume text.'
      }, { status: 400 })
    }

    // Delete existing
    await prisma.resume.deleteMany({
      where: { userId: user.id },
    })

    // Save
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: '',
        fileName: 'Pasted resume',
        rawText: text.substring(0, 10000),
        parsedData,
      },
    })

    return NextResponse.json({ resume, parsed: parsedData })
  } catch (error: any) {
    logger.error('Parse resume error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
