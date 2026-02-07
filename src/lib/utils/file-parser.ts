// src/lib/utils/file-parser.ts

import mammoth from 'mammoth'

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (file.type === 'text/plain') {
    return new TextDecoder().decode(buffer)
  }

  if (file.type === 'application/pdf') {
    return extractFromPDF(arrayBuffer)
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    return extractFromDOCX(buffer)
  }

  throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT.')
}

async function extractFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use pdfjs-dist with worker disabled for server-side
    const pdfjsLib = await import('pdfjs-dist')

    // Disable worker for Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    })

    const pdf = await loadingTask.promise
    const textParts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      textParts.push(pageText)
    }

    const text = textParts
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()

    console.log('PDF extracted, pages:', pdf.numPages, 'chars:', text.length)

    if (text.length < 50) {
      throw new Error('Could not extract meaningful text from PDF')
    }

    return text
  } catch (error: any) {
    console.error('PDF parsing error:', error)
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
