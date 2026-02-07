// src/lib/utils/file-parser.ts

import mammoth from 'mammoth'

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (file.type === 'text/plain') {
    return new TextDecoder().decode(buffer)
  }

  if (file.type === 'application/pdf') {
    // PDF parsing is unreliable in Next.js server environment
    // Direct users to paste text instead
    throw new Error(
      'PDF parsing is not supported. Please copy your resume text and use "Paste Resume Text" instead.'
    )
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    return extractFromDOCX(buffer)
  }

  throw new Error('Unsupported file type. Please use DOCX, TXT, or paste your resume text.')
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
      .replace(/\s+/g, ' ')
      .trim()

    console.log('DOCX extracted, chars:', text.length)

    if (text.length < 50) {
      throw new Error('Could not extract meaningful text from document')
    }

    return text
  } catch (error: any) {
    console.error('DOCX parsing error:', error)
    throw new Error('Could not parse document. Try pasting the text instead.')
  }
}
