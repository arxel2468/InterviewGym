export type SpeakOptions = {
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export type SpeakHandle = {
  stop: () => void
}

/**
 * Check if browser TTS is supported
 */
export function isBrowserTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Get available browser voices
 */
export function getBrowserVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserTTSSupported()) return []
  return window.speechSynthesis.getVoices()
}

/**
 * Find the best English voice available
 */
function findBestVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  // Priority: Google > Microsoft > Others, and prefer en-US or en-GB
  const priorities = [
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith('en') && v.name.includes('Google'),
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith('en-GB') && v.name.includes('Google'),
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith('en') && v.name.includes('Microsoft'),
    (v: SpeechSynthesisVoice) => v.lang === 'en-GB',
    (v: SpeechSynthesisVoice) => v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
  ]

  for (const predicate of priorities) {
    const match = voices.find(predicate)
    if (match) return match
  }

  return voices[0] || null
}

/**
 * Speak text using browser's speech synthesis
 */
export function speakText(
  text: string,
  options: SpeakOptions = {}
): SpeakHandle {
  const {
    rate = 0.95,
    pitch = 1,
    volume = 1,
    onStart,
    onEnd,
    onError,
  } = options

  if (!isBrowserTTSSupported()) {
    onError?.('Speech synthesis not supported in this browser')
    return { stop: () => {} }
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)

  // Set voice
  const voices = getBrowserVoices()
  const bestVoice = findBestVoice(voices)
  if (bestVoice) {
    utterance.voice = bestVoice
  }

  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume

  utterance.onstart = () => onStart?.()
  utterance.onend = () => onEnd?.()
  utterance.onerror = (event) =>
    onError?.(event.error || 'Speech synthesis error')

  // Handle Chrome's bug with long text (gets cut off)
  if (text.length > 200) {
    speakLongText(text, utterance, { onStart, onEnd, onError })
  } else {
    window.speechSynthesis.speak(utterance)
  }

  return {
    stop: () => {
      window.speechSynthesis.cancel()
      onEnd?.()
    },
  }
}

/**
 * Handle long text by splitting into sentences
 */
function speakLongText(
  text: string,
  baseUtterance: SpeechSynthesisUtterance,
  callbacks: Pick<SpeakOptions, 'onStart' | 'onEnd' | 'onError'>
): void {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  let currentIndex = 0
  let hasStarted = false

  const speakNext = () => {
    if (currentIndex >= sentences.length) {
      callbacks.onEnd?.()
      return
    }

    const sentence = sentences[currentIndex].trim()
    if (!sentence) {
      currentIndex++
      speakNext()
      return
    }

    const utterance = new SpeechSynthesisUtterance(sentence)
    utterance.voice = baseUtterance.voice
    utterance.rate = baseUtterance.rate
    utterance.pitch = baseUtterance.pitch
    utterance.volume = baseUtterance.volume

    utterance.onstart = () => {
      if (!hasStarted) {
        hasStarted = true
        callbacks.onStart?.()
      }
    }

    utterance.onend = () => {
      currentIndex++
      speakNext()
    }

    utterance.onerror = (event) => {
      callbacks.onError?.(event.error || 'Speech error')
    }

    window.speechSynthesis.speak(utterance)
  }

  speakNext()
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (isBrowserTTSSupported()) {
    window.speechSynthesis.cancel()
  }
}
