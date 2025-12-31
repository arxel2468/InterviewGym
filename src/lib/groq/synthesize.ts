import { getGroqApiKey } from './client'
import { executeWithFallback, getTTSFallbackMessage, TTSFallbackLevel } from './fallback'

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

export async function synthesizeSpeech(
  text: string,
  onRetry?: (message: string, attempt: number) => void
): Promise<SynthesisResult | SynthesisError> {
  const result = await executeWithFallback<ArrayBuffer>(
    'tts',
    async (modelId) => {
      // Use direct fetch since SDK may not support audio.speech
      const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getGroqApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          input: text,
          voice: 'tara', // Default voice
          response_format: 'wav',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`TTS API error: ${response.status} - ${errorText}`)
      }

      return response.arrayBuffer()
    },
    onRetry
  )

  if (!result.success) {
    // Signal to use browser TTS as final fallback
    return {
      success: false,
      error: result.error,
      friendlyMessage: getTTSFallbackMessage('browser'),
      shouldUseBrowserTTS: true,
    }
  }

  const fallbackLevel: TTSFallbackLevel = result.wasDegraded ? 'secondary' : 'primary'

  return {
    audio: result.data,
    model: result.model,
    source: 'groq',
    wasDegraded: result.wasDegraded,
    fallbackLevel,
  }
}

/**
 * Check if TTS result indicates we should use browser fallback
 */
export function shouldUseBrowserFallback(
  result: SynthesisResult | SynthesisError
): result is SynthesisError {
  return 'shouldUseBrowserTTS' in result && result.shouldUseBrowserTTS
}