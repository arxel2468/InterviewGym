import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { synthesizeChunk, splitForStreaming, shouldUseBrowserFallback } from '@/lib/groq/synthesize'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const requestSchema = z.object({
  text: z.string().min(1).max(4096),
  chunked: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, chunked } = requestSchema.parse(body)

    if (chunked) {
      // Chunked mode: synthesize first sentence only (faster response)
      const { first, rest } = splitForStreaming(text)

      const result = await synthesizeChunk(first)

      if (shouldUseBrowserFallback(result)) {
        return NextResponse.json({
          shouldUseBrowserTTS: true,
          fullText: text,
          friendlyMessage: result.friendlyMessage,
        })
      }

      const base64Audio = Buffer.from(result.audio).toString('base64')

      return NextResponse.json({
        audio: base64Audio,
        model: result.model,
        wasDegraded: result.wasDegraded,
        spokenText: first,
        remainingText: rest,
      })
    }

    // Full mode: synthesize entire text
    const result = await synthesizeChunk(text)

    if (shouldUseBrowserFallback(result)) {
      return NextResponse.json({
        shouldUseBrowserTTS: true,
        friendlyMessage: result.friendlyMessage,
      })
    }

    const base64Audio = Buffer.from(result.audio).toString('base64')

    return NextResponse.json({
      audio: base64Audio,
      model: result.model,
      wasDegraded: result.wasDegraded,
      fallbackLevel: result.fallbackLevel,
    })
  } catch (error: unknown) {
    const message = error instanceof z.ZodError ? 'Invalid request' : 'Synthesis failed'
    logger.error('Synthesis route error', { error: String(error) })

    return NextResponse.json({
      shouldUseBrowserTTS: true,
      friendlyMessage: "Using your browser's voice instead.",
    })
  }
}
