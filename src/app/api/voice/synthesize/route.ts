import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { synthesizeSpeech, shouldUseBrowserFallback } from '@/lib/groq/synthesize'
import { z } from 'zod'

const requestSchema = z.object({
  text: z.string().min(1).max(4096),
})

export async function POST(request: Request) {
  try {
    // Verify auth
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text } = requestSchema.parse(body)

    // Synthesize with fallback
    const result = await synthesizeSpeech(text)
    
    // Check if we should use browser TTS
    if (shouldUseBrowserFallback(result)) {
      return NextResponse.json({
        shouldUseBrowserTTS: true,
        friendlyMessage: result.friendlyMessage,
      })
    }

    // Return audio as base64 for easy client handling
    const base64Audio = Buffer.from(result.audio).toString('base64')

    return NextResponse.json({
      audio: base64Audio,
      model: result.model,
      wasDegraded: result.wasDegraded,
      fallbackLevel: result.fallbackLevel,
    })
  } catch (error: any) {
    console.error('Synthesis error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    
    // Signal to use browser TTS
    return NextResponse.json({
      shouldUseBrowserTTS: true,
      friendlyMessage: "Our cloud interviewers are busy. Using your browser's voice instead!",
    })
  }
}