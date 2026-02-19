import { getBestModel } from './models'

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

// Available voices for Orpheus model
const _VOICES = ['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy'] as const
type Voice = typeof _VOICES[number]

export async function synthesizeSpeech(
  text: string,
  voice: Voice = 'diana' // Changed from 'tara' to 'diana'
): Promise<SynthesisResult | SynthesisError> {
  // Get best available TTS model
  const model = await getBestModel('tts')
  
  if (!model) {
    logger.warn('No TTS model available, will use browser TTS')
    return {
      success: false,
      error: 'No TTS model available',
      friendlyMessage: "Our cloud interviewers are busy. Using your browser's voice instead!",
      shouldUseBrowserTTS: true,
    }
  }

  try {
    logger.info(`Using TTS model: ${model}, voice: ${voice}`)

    // Use direct API call since SDK may not have audio.speech typed
    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: voice,
        response_format: 'wav',
        input: text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('TTS API error:', response.status, errorText)
      throw new Error(`TTS API error: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    
    return {
      audio: arrayBuffer,
      model: model,
      source: 'groq',
      wasDegraded: false,
      fallbackLevel: 'primary',
    }
  } catch (error) {
    logger.error('TTS synthesis failed:', error)
    
    return {
      success: false,
      error: String(error),
      friendlyMessage: "Our cloud interviewers are busy. Using your browser's voice instead!",
      shouldUseBrowserTTS: true,
    }
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
