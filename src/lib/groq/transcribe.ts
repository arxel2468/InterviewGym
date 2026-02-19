import { getGroqClient } from './client'
import { executeWithFallback } from './fallback'

export type TranscriptionResult = {
  text: string
  duration: number
  model: string
  wasDegraded: boolean
}

export type TranscriptionError = {
  success: false
  error: string
  friendlyMessage: string
}

export async function transcribeAudio(
  audioBlob: Blob,
  onRetry?: (message: string, attempt: number) => void
): Promise<TranscriptionResult | TranscriptionError> {
  const groq = getGroqClient()

  // Validate blob
  if (!audioBlob || audioBlob.size === 0) {
    return {
      success: false,
      error: 'Empty audio blob',
      friendlyMessage: 'No audio was recorded. Please try again.',
    }
  }

  // Log for debugging
  logger.info('Transcribing audio:', {
    size: audioBlob.size,
    type: audioBlob.type,
  })

  // Determine file extension based on mime type
  let extension = 'webm'
  if (audioBlob.type.includes('mp4')) extension = 'mp4'
  else if (audioBlob.type.includes('ogg')) extension = 'ogg'
  else if (audioBlob.type.includes('wav')) extension = 'wav'

  // Convert Blob to File with proper extension
  const file = new File([audioBlob], `recording.${extension}`, {
    type: audioBlob.type || 'audio/webm'
  })

  const result = await executeWithFallback<{ text: string; duration: number }>(
    'stt',
    async (modelId) => {
      logger.info(`Attempting transcription with model: ${modelId}`)

      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: modelId,
        language: 'en',
        response_format: 'verbose_json',
      })

      const result = transcription as any

      if (!transcription.text || transcription.text.trim().length === 0) {
        throw new Error('Empty transcription result')
      }

      logger.info('Transcription successful:', transcription.text.substring(0, 50))

      return {
        text: transcription.text,
        duration: result.duration || 0,
      }
    },
    onRetry
  )

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      friendlyMessage: result.friendlyMessage,
    }
  }

  return {
    text: result.data.text,
    duration: result.data.duration,
    model: result.model,
    wasDegraded: result.wasDegraded,
  }
}
