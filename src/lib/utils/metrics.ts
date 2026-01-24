// Common filler words in English
const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'ummm',
  'er', 'err', 'errr',
  'ah', 'ahh', 'ahhh',
  'like',
  'you know',
  'i mean',
  'sort of',
  'kind of',
  'basically',
  'actually',
  'literally',
  'right',
  'so',
  'well',
  'anyway',
  'anyways',
]

// Phrases that indicate hesitation
const HEDGE_PHRASES = [
  'i think',
  'i guess',
  'i suppose',
  'maybe',
  'probably',
  'perhaps',
  'not sure',
  "don't know",
  'might be',
  'could be',
]

export type TextMetrics = {
  wordCount: number
  fillerWordCount: number
  fillerWords: { word: string; count: number }[]
  hedgePhraseCount: number
  hedgePhrases: { phrase: string; count: number }[]
  sentenceCount: number
  averageWordsPerSentence: number
  starStructureDetected: boolean
}

/**
 * Analyze text for filler words, hedging, and structure
 */
export function analyzeText(text: string): TextMetrics {
  const normalizedText = text.toLowerCase().trim()
  const words = normalizedText.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  // Count filler words
  const fillerWordCounts: Record<string, number> = {}
  let totalFillerWords = 0

  for (const filler of FILLER_WORDS) {
    const regex = filler.includes(' ')
      ? new RegExp(filler, 'gi')
      : new RegExp(`\\b${filler}\\b`, 'gi')

    const matches = normalizedText.match(regex)
    if (matches && matches.length > 0) {
      fillerWordCounts[filler] = matches.length
      totalFillerWords += matches.length
    }
  }

  // Count hedge phrases
  const hedgePhraseCounts: Record<string, number> = {}
  let totalHedgePhrases = 0

  for (const phrase of HEDGE_PHRASES) {
    const regex = new RegExp(phrase, 'gi')
    const matches = normalizedText.match(regex)
    if (matches && matches.length > 0) {
      hedgePhraseCounts[phrase] = matches.length
      totalHedgePhrases += matches.length
    }
  }

  // Count sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  const averageWordsPerSentence = sentenceCount > 0
    ? Math.round(wordCount / sentenceCount)
    : 0

  // Detect STAR structure
  const starStructureDetected = detectStarStructure(normalizedText)

  return {
    wordCount,
    fillerWordCount: totalFillerWords,
    fillerWords: Object.entries(fillerWordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count),
    hedgePhraseCount: totalHedgePhrases,
    hedgePhrases: Object.entries(hedgePhraseCounts)
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count),
    sentenceCount,
    averageWordsPerSentence,
    starStructureDetected,
  }
}

/**
 * Detect if response follows STAR structure
 */
function detectStarStructure(text: string): boolean {
  const situationIndicators = [
    'situation was', 'context was', 'background', 'we were',
    'i was working', 'at the time', 'this happened when',
  ]

  const taskIndicators = [
    'task was', 'my role was', 'responsible for', 'needed to',
    'had to', 'goal was', 'objective',
  ]

  const actionIndicators = [
    'i did', 'i took', 'i decided', 'i implemented', 'i created',
    'i led', 'i organized', 'my approach', 'first i', 'then i', 'next i',
  ]

  const resultIndicators = [
    'result was', 'outcome was', 'ended up', 'led to', 'resulted in',
    'achieved', 'improved', 'reduced', 'increased', 'saved', 'learned',
  ]

  const hasSituation = situationIndicators.some(i => text.includes(i))
  const hasTask = taskIndicators.some(i => text.includes(i))
  const hasAction = actionIndicators.some(i => text.includes(i))
  const hasResult = resultIndicators.some(i => text.includes(i))

  const components = [hasSituation, hasTask, hasAction, hasResult]
  return components.filter(Boolean).length >= 3
}

/**
 * Estimate pause count from transcription patterns
 */
export function estimatePauses(text: string): number {
  const ellipses = (text.match(/\.{3,}/g) || []).length
  const dashes = (text.match(/—|--/g) || []).length

  const sentences = text.split(/[.!?]+/)
  const fillerStarts = sentences.filter(s => {
    const trimmed = s.trim().toLowerCase()
    return trimmed.startsWith('um') ||
           trimmed.startsWith('uh') ||
           trimmed.startsWith('so,') ||
           trimmed.startsWith('well,')
  }).length

  return ellipses + dashes + fillerStarts
}

/**
 * Get assessment text for filler word ratio
 */
export function getFillerAssessment(fillerCount: number, totalWords: number): string {
  if (totalWords === 0) return ''
  const ratio = fillerCount / totalWords
  if (ratio < 0.02) return 'Excellent'
  if (ratio < 0.05) return 'Good'
  if (ratio < 0.10) return 'Needs work'
  return 'High - practice reducing'
}

/**
 * Get assessment text for response length
 */
export function getLengthAssessment(avgWords: number): string {
  if (avgWords < 30) return 'Too brief'
  if (avgWords < 50) return 'Could elaborate more'
  if (avgWords <= 150) return 'Good length'
  return 'Consider being more concise'
}

/**
 * Get assessment text for response time
 */
export function getTimeAssessment(avgMs: number): string {
  const seconds = avgMs / 1000
  if (seconds < 10) return 'Very quick'
  if (seconds < 30) return 'Good pace'
  if (seconds < 60) return 'Thoughtful'
  if (seconds < 120) return 'Taking time'
  return 'Quite long'
}
