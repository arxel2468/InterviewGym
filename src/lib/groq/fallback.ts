import { getModelFallbacks, ModelCategory } from './models'

// ============================================
// FUN ERROR MESSAGES
// ============================================

const INTERVIEWER_EXCUSES = {
  tts: [
    'The interviewer lost their voice. Switching to a backup...',
    'Our interviewer is gargling coffee. One moment...',
    "The interviewer's microphone is acting up. Trying another...",
    'Seems the interviewer is on mute. Let me fix that...',
  ],

  stt: [
    "The interviewer couldn't quite catch that. Trying again...",
    'Bad reception in the interview room. Reconnecting...',
    'The interviewer was distracted by a LinkedIn notification. Refocusing...',
    'Audio got lost in the cloud. Fetching it back...',
  ],

  chat: [
    'The interviewer is overthinking your answer. Consulting a colleague...',
    'Our senior interviewer stepped out. Grabbing the next available...',
    "The interviewer's brain froze. Rebooting their thoughts...",
    'That question stumped even the interviewer. Getting backup...',
  ],
}

const FALLBACK_MESSAGES = {
  tts: {
    degraded:
      "We're experiencing high demand. You've been connected to our backup interviewer — they're a bit robotic, but still helpful!",
    failed:
      'All our interviewers are stuck in meetings. Please try again in a few minutes, or practice with a friend in the meantime!',
  },

  stt: {
    degraded:
      'Our primary transcription service is busy. Using backup — might be slightly less accurate.',
    failed:
      "The interview room has terrible acoustics today. We couldn't hear you. Please try speaking again, or check your microphone.",
  },

  chat: {
    degraded:
      "Our senior interviewers are swamped with candidates. You've been connected to a junior interviewer — they're still learning, but eager to help!",
    failed:
      'All our interviewers are in back-to-back meetings. Even the interns are busy! Please grab a coffee and come back in a bit.',
  },
}

function getRandomExcuse(category: ModelCategory): string {
  const excuses = INTERVIEWER_EXCUSES[category]
  return excuses[Math.floor(Math.random() * excuses.length)]
}

// ============================================
// FALLBACK EXECUTION
// ============================================

export type FallbackResult<T> =
  | {
      success: true
      data: T
      model: string
      attemptedModels: string[]
      wasDegraded: boolean
    }
  | {
      success: false
      error: string
      friendlyMessage: string
      attemptedModels: string[]
    }

export type ModelExecutor<T> = (modelId: string) => Promise<T>

/**
 * Try each model in the fallback chain until one works
 */
export async function executeWithFallback<T>(
  category: ModelCategory,
  executor: ModelExecutor<T>,
  onRetry?: (excuse: string, attemptNumber: number) => void
): Promise<FallbackResult<T>> {
  const models = await getModelFallbacks(category)
  const attemptedModels: string[] = []

  if (models.length === 0) {
    return {
      success: false,
      error: 'No models available',
      friendlyMessage: FALLBACK_MESSAGES[category].failed,
      attemptedModels: [],
    }
  }

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    attemptedModels.push(model)

    try {
      const result = await executor(model)

      return {
        success: true,
        data: result,
        model: model,
        attemptedModels,
        wasDegraded: i > 0, // True if we had to fall back from the best model
      }
    } catch (error) {
      console.warn(`Model ${model} failed:`, error)

      // Notify about retry (for UI feedback)
      if (onRetry && i < models.length - 1) {
        onRetry(getRandomExcuse(category), i + 1)
      }

      // Continue to next model
      continue
    }
  }

  // All models failed
  return {
    success: false,
    error: 'All models failed',
    friendlyMessage: FALLBACK_MESSAGES[category].failed,
    attemptedModels,
  }
}

/**
 * Get a degraded service message for the category
 */
export function getDegradedMessage(category: ModelCategory): string {
  return FALLBACK_MESSAGES[category].degraded
}

/**
 * Get a failure message for the category
 */
export function getFailureMessage(category: ModelCategory): string {
  return FALLBACK_MESSAGES[category].failed
}

// ============================================
// BROWSER TTS FALLBACK INDICATOR
// ============================================

export type TTSFallbackLevel = 'primary' | 'secondary' | 'browser' | 'failed'

export function getTTSFallbackMessage(level: TTSFallbackLevel): string {
  switch (level) {
    case 'primary':
      return '' // No message needed, everything is fine
    case 'secondary':
      return 'Using backup voice system...'
    case 'browser':
      return "Our cloud interviewers are busy. Using your browser's voice instead — it's a bit robotic, but gets the job done!"
    case 'failed':
      return 'All voice systems are down. The interviewer has completely lost their voice. Please try again later!'
  }
}
