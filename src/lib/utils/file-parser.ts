// src/lib/utils/file-parser.ts

import mammoth from 'mammoth'

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (file.type === 'text/plain') {
    return new TextDecoder().decode(buffer)
  }

  if (file.type === 'application/pdf') {
    return extractFromPDF(buffer)
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    return extractFromDOCX(buffer)
  }

  throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT.')
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid ESM/CJS issues
    const pdfParse = await import('pdf-parse').then(m => m.default || m)

    const data = await pdfParse(buffer)
    const text = data.text
      .replace(/\s+/g, ' ')
      .trim()

    console.log('PDF extracted, pages:', data.numpages, 'chars:', text.length)

    if (text.length < 50) {
      throw new Error('Could not extract meaningful text from PDF')
    }

    return text
  } catch (error: any) {
    console.error('PDF parsing error:', error)

    // Provide helpful error message
    if (error.message?.includes('extract meaningful text')) {
      throw error
    }

    throw new Error(
      'Could not parse PDF. The file may be scanned/image-based. Please paste the text instead.'
    )
  }
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
