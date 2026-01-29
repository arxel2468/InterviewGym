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

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT, or use the paste option.'
      }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 2MB.'
      }, { status: 400 })
    }

    // Extract text
    const rawText = await extractTextFromFile(file)

    console.log('Extracted text length:', rawText.length)
    console.log('First 500 chars:', rawText.substring(0, 500))

    if (rawText.length < 100) {
      return NextResponse.json({
        error: 'Could not extract enough text. PDF parsing is limited - please use "Paste Text" option instead for best results.'
      }, { status: 400 })
    }

    // Parse resume
    const parsedData = await parseResume(rawText)

    console.log('Parsed resume:', {
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
        rawText: rawText.substring(0, 10000), // Store for debugging
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

  // For plain text files
  if (file.type === 'text/plain') {
    return new TextDecoder().decode(buffer)
  }

  // For PDF - try to extract readable text
  // This is a basic extraction that works for text-based PDFs
  // Binary/scanned PDFs won't work well
  const text = buffer.toString('utf-8')

  // Try to find text content in PDF
  // PDFs store text in various ways, this is a simple heuristic
  let extracted = ''

  // Method 1: Look for text between parentheses (PDF text objects)
  const textMatches = text.match(/\(([^)]+)\)/g)
  if (textMatches) {
    extracted = textMatches
      .map(m => m.slice(1, -1))
      .filter(t => t.length > 2 && /[a-zA-Z]/.test(t))
      .join(' ')
  }

  // Method 2: If that didn't work well, try extracting all printable ASCII
  if (extracted.length < 200) {
    extracted = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Clean up common PDF artifacts
  extracted = extracted
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return extracted
}
