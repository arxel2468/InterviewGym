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
  
  // Convert Blob to File for Groq API
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type })

  const result = await executeWithFallback<{ text: string; duration: number }>(
    'stt',
    async (modelId) => {
      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: modelId,
        language: 'en',
        prompt: 'This is an interview practice session. The speaker is answering behavioral interview questions clearly and professionally.',
        response_format: 'verbose_json',
      })

      return {
        text: transcription.text,
        duration: transcription.duration || 0,
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