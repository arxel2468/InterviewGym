import { getBestModel } from './models'
import { sanitizeForTTS } from '@/lib/utils/sanitize'
import { logger } from '@/lib/logger'

export type SynthesisResult = {
  audio: ArrayBuffer
  model: string
  source: 'groq'
  wasDegraded: boolean
  fallbackLevel: TTSFallbackLevel
}

export type SynthesisError = {
  success: false
  error: string
  friendlyMessage: string
  shouldUseBrowserTTS: true
}

export type TTSFallbackLevel = 'primary' | 'secondary' | 'browser' | 'failed'

const VOICES = [
  'autumn',
  'diana',
  'hannah',
  'austin',
  'daniel',
  'troy',
] as const
type Voice = (typeof VOICES)[number]

/**
 * Split text into sentences for chunked TTS
 * First chunk is spoken immediately, rest synthesized in parallel
 */
export function splitForStreaming(text: string): {
  first: string
  rest: string | null
} {
  const cleaned = sanitizeForTTS(text)

  // Find first sentence boundary
  const match = cleaned.match(/^(.+?[.!?])\s+([\s\S]+)$/)

  if (match && match[1].length >= 20) {
    return { first: match[1].trim(), rest: match[2].trim() }
  }

  // Text is one sentence or too short to split
  return { first: cleaned, rest: null }
}

/**
 * Synthesize a single chunk of text
 */
export async function synthesizeChunk(
  text: string,
  voice: Voice = 'diana'
): Promise<SynthesisResult | SynthesisError> {
  const model = await getBestModel('tts')

  if (!model) {
    return {
      success: false,
      error: 'No TTS model available',
      friendlyMessage: "Using your browser's voice instead.",
      shouldUseBrowserTTS: true,
    }
  }

  try {
    const startTime = Date.now()

    const response = await fetch(
      'https://api.groq.com/openai/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          voice,
          response_format: 'wav',
          input: text,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('TTS API error', {
        status: response.status,
        error: errorText,
      })
      throw new Error(`TTS API error: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const latency = Date.now() - startTime

    logger.info('TTS synthesis complete', {
      model,
      latencyMs: latency,
      textLength: text.length,
    })

    return {
      audio: arrayBuffer,
      model,
      source: 'groq',
      wasDegraded: false,
      fallbackLevel: 'primary',
    }
  } catch (error) {
    logger.error('TTS synthesis failed', { error: String(error) })

    return {
      success: false,
      error: String(error),
      friendlyMessage: "Using your browser's voice instead.",
      shouldUseBrowserTTS: true,
    }
  }
}

/**
 * Full synthesis — used by the API route for single-shot
 */
export async function synthesizeSpeech(
  text: string,
  voice: Voice = 'diana'
): Promise<SynthesisResult | SynthesisError> {
  return synthesizeChunk(sanitizeForTTS(text), voice)
}

/**
 * Check if result indicates browser fallback needed
 */
export function shouldUseBrowserFallback(
  result: SynthesisResult | SynthesisError
): result is SynthesisError {
  return 'shouldUseBrowserTTS' in result && result.shouldUseBrowserTTS
}
