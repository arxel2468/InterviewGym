import * as pdfParse from 'pdf-parse'
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

  throw new Error('Unsupported file type')
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdf = (pdfParse as any).default || pdfParse
    const data = await pdf(buffer)
    const text = data.text
      .replace(/\s+/g, ' ')
      .trim()
    
    console.log('PDF extracted, pages:', data.numpages, 'chars:', text.length)
    return text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Could not parse PDF. Try pasting the text instead.')
  }
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
      .replace(/\s+/g, ' ')
      .trim()
    
    console.log('DOCX extracted, chars:', text.length)
    return text
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Could not parse document. Try pasting the text instead.')
  }
}
