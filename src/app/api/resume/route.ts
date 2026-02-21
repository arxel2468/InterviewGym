import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { parseResume } from '@/lib/groq/resume-parser'
import { extractTextFromFile } from '@/lib/utils/file-parser'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resume = await prisma.resume.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ resume })
  } catch (error) {
    logger.error('Get resume error:', { error: String(error) })
    return NextResponse.json({ error: 'Failed to get resume' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT.'
      }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 5MB.'
      }, { status: 400 })
    }

    // Extract text using proper parsers
    let rawText: string
    try {
      rawText = await extractTextFromFile(file)
    } catch (parseError: any) {
      return NextResponse.json({
        error: parseError.message || 'Failed to parse file'
      }, { status: 400 })
    }

    logger.info('Extracted text', { length: rawText.length })

    if (rawText.length < 100) {
      return NextResponse.json({
        error: 'Could not extract enough text from file.'
      }, { status: 400 })
    }

    // Parse with AI
    const parsedData = await parseResume(rawText)

    logger.info('Parsed resume:', {
      name: parsedData.name,
      skills: parsedData.skills?.length || 0,
      experience: parsedData.experience?.length || 0,
      projects: parsedData.projects?.length || 0,
    })

    // Delete existing
    await prisma.resume.deleteMany({
      where: { userId: user.id },
    })

    // Save
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: '',
        fileName: file.name,
        rawText: rawText.substring(0, 15000),
        parsedData,
      },
    })

    return NextResponse.json({ resume, parsed: parsedData })
  } catch (error: any) {
    logger.error('Upload resume error', { error: String(error) })
      return NextResponse.json({
      error: error.message || 'Failed to process resume'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.resume.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete resume error', { error: String(error) })
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
  }
}
