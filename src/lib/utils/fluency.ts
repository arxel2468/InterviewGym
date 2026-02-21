const COMMON_GRAMMAR_ISSUES = [
  { pattern: /\bi am having\b/gi, suggestion: '"I have"', category: 'tense' },
  {
    pattern: /\bhe told that\b/gi,
    suggestion: '"he said that"',
    category: 'verb_choice',
  },
  {
    pattern: /\bI did not knew\b/gi,
    suggestion: '"I did not know"',
    category: 'tense',
  },
  {
    pattern: /\bmore better\b/gi,
    suggestion: '"better"',
    category: 'comparison',
  },
  {
    pattern: /\bmyself\s+[A-Z][a-z]*/gi,
    suggestion: '"I am [Name]" or "My name is [Name]"',
    category: 'introduction',
  },
  {
    pattern: /\bkindly\b/gi,
    suggestion: '"please" (less formal)',
    category: 'formality',
  },
  {
    pattern: /\bdo the needful\b/gi,
    suggestion: '"take care of it" or "handle it"',
    category: 'idiom',
  },
  {
    pattern: /\bprepone\b/gi,
    suggestion: '"move up" or "reschedule earlier"',
    category: 'word_choice',
  },
  {
    pattern: /\brevert back\b/gi,
    suggestion: '"respond" or "get back to"',
    category: 'word_choice',
  },
  {
    pattern: /\bsame to same\b/gi,
    suggestion: '"exactly the same"',
    category: 'expression',
  },
  {
    pattern: /\bout of station\b/gi,
    suggestion: '"out of town" or "traveling"',
    category: 'expression',
  },
  {
    pattern: /\bpassed out from\b/gi,
    suggestion: '"graduated from"',
    category: 'word_choice',
  },
]

export type FluencyAnalysis = {
  grammarIssues: {
    found: string
    suggestion: string
    category: string
    count: number
  }[]
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced'
  sentenceComplexity: number // 1-10
  fillerRatio: number
  confidenceMarkers: number // "I believe", "In my experience" vs "maybe", "I think"
  professionalVocabUsed: string[]
}

export function analyzeFluency(text: string): FluencyAnalysis {
  const issues: FluencyAnalysis['grammarIssues'] = []

  for (const rule of COMMON_GRAMMAR_ISSUES) {
    const matches = text.match(rule.pattern)
    if (matches) {
      issues.push({
        found: matches[0],
        suggestion: rule.suggestion,
        category: rule.category,
        count: matches.length,
      })
    }
  }

  // Vocabulary level assessment
  const advancedWords = [
    'implemented',
    'architected',
    'optimized',
    'streamlined',
    'collaborated',
    'spearheaded',
    'leveraged',
    'facilitated',
    'demonstrated',
    'orchestrated',
    'mitigated',
    'scalable',
  ]

  const professionalVocab = advancedWords.filter((word) =>
    text.toLowerCase().includes(word)
  )

  const uniqueWords = new Set(text.toLowerCase().split(/\s+/))
  const vocabLevel =
    professionalVocab.length >= 3
      ? 'advanced'
      : professionalVocab.length >= 1
        ? 'intermediate'
        : 'basic'
  // Confidence markers
  const confidentPhrases = (
    text.match(
      /\b(I believe|in my experience|I'm confident|I successfully|I led|I drove)\b/gi
    ) || []
  ).length
  const hesitantPhrases = (
    text.match(/\b(maybe|I think|I guess|not sure|probably|perhaps)\b/gi) || []
  ).length

  // Sentence complexity
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim())
  const avgLength =
    sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) /
    Math.max(sentences.length, 1)
  const complexity = Math.min(10, Math.round(avgLength / 3))

  const words = text.split(/\s+/)
  const fillerWords = words.filter((w) =>
    ['um', 'uh', 'like', 'basically', 'actually', 'so'].includes(
      w.toLowerCase()
    )
  )

  return {
    grammarIssues: issues,
    vocabularyLevel: vocabLevel,
    sentenceComplexity: complexity,
    fillerRatio: words.length > 0 ? fillerWords.length / words.length : 0,
    confidenceMarkers: confidentPhrases - hesitantPhrases,
    professionalVocabUsed: professionalVocab,
  }
}
