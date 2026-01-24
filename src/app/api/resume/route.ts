import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { parseResume } from '@/lib/groq/resume-parser'

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
    console.error('Get resume error:', error)
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

    // Validate file type
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

    // Validate file size (2MB max - we only need text)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 2MB.'
      }, { status: 400 })
    }

    // Extract text from file (in memory, not stored)
    const rawText = await extractTextFromFile(file)

    if (rawText.length < 50) {
      return NextResponse.json({
        error: 'Could not extract enough text from file. Try a different format or paste your resume text.'
      }, { status: 400 })
    }

    // Parse resume with AI
    const parsedData = await parseResume(rawText)

    // Delete existing resume if any
    await prisma.resume.deleteMany({
      where: { userId: user.id },
    })

    // Save ONLY parsed data to database (no file storage)
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: '', // Not storing file
        fileName: file.name,
        rawText: null, // Not storing raw text either
        parsedData,
      },
    })

    return NextResponse.json({ resume, parsed: parsedData })
  } catch (error) {
    console.error('Upload resume error:', error)
    return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 })
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
    console.error('Delete resume error:', error)
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // For text files
  if (file.type === 'text/plain') {
    return new TextDecoder().decode(buffer)
  }

  // For PDF and DOC files, extract readable text
  // This is a simple extraction - strips non-printable characters
  const text = buffer.toString('utf-8')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return text
}
