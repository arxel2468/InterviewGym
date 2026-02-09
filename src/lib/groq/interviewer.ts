import {
  selectQuestionsForSession,
  BEHAVIORAL_QUESTIONS
} from '@/lib/questions/behavioral'
import { getTechnicalQuestionsForRole, TECHNICAL_QUESTIONS } from '@/lib/questions/technical'
import { getHRScreenQuestions, HR_SCREEN_QUESTIONS } from '@/lib/questions/hr-screen'
import { getSystemDesignQuestions, SYSTEM_DESIGN_QUESTIONS } from '@/lib/questions/system-design'
import { TargetRole, InterviewType, Question } from '@/lib/questions'
import { getGroqClient } from './client'
import { executeWithFallback, getDegradedMessage } from './fallback'
import { getPersona, InterviewerPersona } from '@/lib/prompts/interviewer-personas'
import {
  compressConversationHistory,
  truncateToTokenLimit,
  trackAIUsage,
  estimateTokens
} from '@/lib/ai-optimization'

export type Difficulty = 'warmup' | 'standard' | 'intense'

export type ConversationMessage = {
  role: 'interviewer' | 'candidate'
  content: string
}

export type InterviewContext = {
  difficulty: Difficulty
  interviewType: string
  targetRole?: string
  resumeContext?: string
  conversationHistory: ConversationMessage[]
  questionPlan?: string[]
  currentQuestionIndex?: number
}

export type InterviewerResponse = {
  response: string
  model: string
  wasDegraded: boolean
  degradedMessage?: string
  nextQuestionId?: string
  isClosing?: boolean
}

export type InterviewerError = {
  success: false
  error: string
  friendlyMessage: string
}

/**
 * Sanitize user input before sending to AI
 * - Removes potential prompt injection attempts
 * - Trims excessive whitespace
 * - Limits length
 */
function sanitizeInput(text: string, maxLength: number = 5000): string {
  if (!text) return ''

  return text
    // Remove null bytes and control characters (except newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse multiple newlines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces to single space
    .replace(/ {2,}/g, ' ')
    // Trim
    .trim()
    // Limit length
    .slice(0, maxLength)
}

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(
  persona: InterviewerPersona,
  resumeContext?: string,
  currentQuestion?: Question,
  exchangeCount: number = 0,
  totalPlannedQuestions: number = 5
): string {
  const resumeSection = resumeContext
    ? `\n\nCANDIDATE'S BACKGROUND (from their resume):\n${resumeContext}\n\nYou may reference this background, but do NOT fabricate details not listed here.`
    : ''

  const questionGuidance = currentQuestion
    ? `\n\nCURRENT QUESTION CONTEXT:
Category: ${currentQuestion.category}
Main Question: "${currentQuestion.question}"
What good answers include: ${currentQuestion.lookingFor.join(', ')}
Possible follow-ups: ${currentQuestion.followUps.join(' | ')}`
    : ''

  const progressNote = `\n\nINTERVIEW PROGRESS: Exchange ${exchangeCount} of approximately ${totalPlannedQuestions * 2}. ${
    exchangeCount >= totalPlannedQuestions * 2 - 2
      ? 'This is near the end - wrap up naturally soon.'
      : ''
  }`

  return `You are ${persona.name}, ${persona.title}, conducting a behavioral interview.

YOUR PERSONALITY AND STYLE:
${persona.style}

YOUR BEHAVIORS:
${persona.behaviors.map(b => `- ${b}`).join('\n')}

RESPONSE PATTERNS (use these for brief acknowledgments):
${persona.responsePatterns.join(', ')}

TRANSITION PHRASES (use when moving to new topics):
${persona.transitions.join(', ')}

CRITICAL RULES:
1. You are conducting an INTERVIEW, not having a conversation
2. Ask ONE question or follow-up at a time
3. Keep your responses SHORT - typically 1-3 sentences
4. Do NOT explain why you're asking something
5. Do NOT give feedback or coach during the interview
6. Do NOT say "great question" or similar - YOU ask the questions
7. Stay in character as ${persona.name} throughout
8. When candidate gives weak/vague answer, probe deeper based on your style
9. After 1-2 follow-ups on a topic, move to the next planned question
10. No asterisks, no stage directions, no markdown
${resumeSection}
${questionGuidance}
${progressNote}`
}

// ============================================
// ASK RIGHT QUESTIONS
// ============================================
function getQuestionsForInterview(
  interviewType: string,
  targetRole?: string
): Question[] {
  switch (interviewType) {
    case 'technical':
      return getTechnicalQuestionsForRole((targetRole as TargetRole) || 'fullstack', 6)
    case 'hr_screen':
      return getHRScreenQuestions(8)
    case 'system_design':
      return getSystemDesignQuestions(2)
    case 'behavioral':
    default:
      return selectQuestionsForSession(5)
  }
}

// Also need to get ALL questions for lookup
function getAllQuestions(interviewType: string): Question[] {
  switch (interviewType) {
    case 'technical':
      return TECHNICAL_QUESTIONS
    case 'hr_screen':
      return HR_SCREEN_QUESTIONS
    case 'system_design':
      return SYSTEM_DESIGN_QUESTIONS
    case 'behavioral':
    default:
      return BEHAVIORAL_QUESTIONS
  }
}

// ============================================
// INTERVIEW STATE MANAGEMENT
// ============================================

function determineNextAction(
  conversationHistory: ConversationMessage[],
  questionPlan: string[],
  currentQuestionIndex: number
): { action: 'follow_up' | 'next_question' | 'close'; questionId?: string } {
  const candidateResponses = conversationHistory.filter(m => m.role === 'candidate')
  const exchangeCount = candidateResponses.length

  // How many exchanges on current topic?
  // Find last interviewer message that was a new question (not follow-up)
  const recentExchanges = conversationHistory.slice(-4) // Last 2 exchanges
  const followUpCount = recentExchanges.filter(m => m.role === 'candidate').length

  // Time to close?
  if (currentQuestionIndex >= questionPlan.length - 1 && followUpCount >= 1) {
    return { action: 'close' }
  }

  // Should we follow up or move on?
  // Follow up if: less than 2 follow-ups on this topic AND answer was short/vague
  const lastCandidateResponse = candidateResponses[candidateResponses.length - 1]?.content || ''
  const wordCount = lastCandidateResponse.split(/\s+/).length
  const isShortAnswer = wordCount < 40
  const shouldFollowUp = followUpCount < 2 && isShortAnswer

  if (shouldFollowUp) {
    return { action: 'follow_up', questionId: questionPlan[currentQuestionIndex] }
  }

  // Move to next question
  const nextIndex = currentQuestionIndex + 1
  if (nextIndex < questionPlan.length) {
    return { action: 'next_question', questionId: questionPlan[nextIndex] }
  }

  return { action: 'close' }
}


function getRandomFollowUp(question: Question): string | null {
  if (!question.followUps || question.followUps.length === 0) return null
  return question.followUps[Math.floor(Math.random() * question.followUps.length)]
}


// ============================================
// MAIN RESPONSE GENERATOR
// ============================================

export async function generateInterviewerResponse(
  context: InterviewContext,
  onRetry?: (message: string, attempt: number) => void
): Promise<InterviewerResponse | InterviewerError> {
    const groq = getGroqClient()
    const persona = getPersona(context.difficulty)

    // Initialize question plan if this is the start
    let questionPlan = context.questionPlan || []
    let currentQuestionIndex = context.currentQuestionIndex || 0

    // Get the correct question bank for this interview type
    const allQuestions = getAllQuestions(context.interviewType)

    if (questionPlan.length === 0) {
      const questions = getQuestionsForInterview(context.interviewType, context.targetRole)
      questionPlan = questions.map(q => q.id)
    }

    const exchangeCount = context.conversationHistory.filter(m => m.role === 'candidate').length

    // Look up current question from the CORRECT question bank (not hardcoded BEHAVIORAL_QUESTIONS)
    const currentQuestion = allQuestions.find(q => q.id === questionPlan[currentQuestionIndex])

    // Determine what to do next
    const nextAction = context.conversationHistory.length === 0
      ? { action: 'next_question' as const, questionId: questionPlan[0] }
      : determineNextAction(context.conversationHistory, questionPlan, currentQuestionIndex)

    // Build the prompt
    const systemPrompt = buildSystemPrompt(
      persona,
      context.resumeContext,
      currentQuestion,
      exchangeCount,
      questionPlan.length
    )

    // Build instruction for this specific response
    let instruction: string

    if (context.conversationHistory.length === 0) {
      // Opening
      instruction = `Start the interview. Briefly introduce yourself (name and role only, one sentence), then ask your first question:
  "${currentQuestion?.question || 'Tell me about yourself.'}"

  Keep the intro SHORT - no more than 2 sentences total.`
    } else if (nextAction.action === 'close') {
      instruction = `The interview is wrapping up. Thank the candidate briefly and ask if they have any questions for you, or if there's anything else they'd like to share. Be natural and brief.`
    } else if (nextAction.action === 'follow_up') {
      const followUp = currentQuestion ? getRandomFollowUp(currentQuestion) : null
      instruction = `The candidate's answer was brief or vague. Ask a follow-up to get more depth.
  ${followUp ? `Consider asking something like: "${followUp}"` : 'Probe deeper on what they just said.'}
  Remember your style: ${persona.style}
  Keep it to ONE follow-up question.`
    } else {
      // Next question - look up from correct question bank
      const nextQuestion = allQuestions.find(q => q.id === nextAction.questionId)
      instruction = `Time to move to a new topic. Use a brief transition, then ask:
  "${nextQuestion?.question || 'Tell me about another experience.'}"

  Keep the transition SHORT - just 1-2 words, then the question.`
    }

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Compress and sanitize conversation history
  const compressedHistory = compressConversationHistory(context.conversationHistory, 12)

  for (const msg of compressedHistory) {
    messages.push({
      role: msg.role === 'interviewer' ? 'assistant' : 'user',
      content: msg.content,
    })
  }

  // Add instruction
  messages.push({
    role: 'user',
    content: `[INSTRUCTION FOR YOUR NEXT RESPONSE]\n${instruction}`,
  })

  const result = await executeWithFallback<string>(
    'chat',
    async (modelId) => {

      const startTime = Date.now()

      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 200, // Keep responses short
      })

      trackAIUsage({
        model: modelId,
        inputTokens: estimateTokens(messages.map(m => m.content).join('')),
        outputTokens: estimateTokens(completion.choices[0]?.message?.content || ''),
        latencyMs: Date.now() - startTime,
        timestamp: new Date(),
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('Empty response from model')
      }

      return response.trim()
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

  // Clean up response
  let cleanResponse = result.data
    .replace(/\[.*?\]/g, '') // Remove bracketed instructions
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\*/g, '') // Remove markdown italic
    .trim()

  return {
    response: cleanResponse,
    model: result.model,
    wasDegraded: result.wasDegraded,
    degradedMessage: result.wasDegraded ? getDegradedMessage('chat') : undefined,
    nextQuestionId: nextAction.questionId,
    isClosing: nextAction.action === 'close',
  }
}

// ============================================
// FEEDBACK GENERATOR (keep existing but improve)
// ============================================

export type FeedbackResult = {
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  overallScore: number
  clarityScore: number
  structureScore: number
  relevanceScore: number
  confidenceScore: number
  summary: string
  model: string
  wasDegraded: boolean
}

export type FeedbackError = {
  success: false
  error: string
  friendlyMessage: string
}

export async function generateFeedback(
  conversationHistory: ConversationMessage[],
  difficulty: Difficulty,
  onRetry?: (message: string, attempt: number) => void
): Promise<FeedbackResult | FeedbackError> {
  const groq = getGroqClient()

  const transcript = conversationHistory
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n')

  const candidateResponses = conversationHistory.filter((m) => m.role === 'candidate')

  if (candidateResponses.length === 0) {
    return {
      success: false,
      error: 'No candidate responses to analyze',
      friendlyMessage: "We couldn't find any responses to analyze.",
    }
  }

  const prompt = `You are an expert interview coach analyzing a behavioral interview practice session.

FULL TRANSCRIPT:
${transcript}

INTERVIEW DETAILS:
- Difficulty level: ${difficulty}
- Total candidate responses: ${candidateResponses.length}

ANALYZE THE CANDIDATE'S PERFORMANCE:

1. STRUCTURE: Did they use STAR format (Situation, Task, Action, Result)?
2. SPECIFICITY: Did they give concrete examples with details?
3. METRICS: Did they quantify their impact when possible?
4. RELEVANCE: Did they actually answer the questions asked?
5. CONFIDENCE: Did they speak with certainty or hedge excessively?
6. CLARITY: Were their answers easy to follow?

PROVIDE FEEDBACK IN THIS EXACT JSON FORMAT:
{
  "strengths": [
    "Specific strength with quote from their answer as evidence"
  ],
  "improvements": [
    "Specific weakness with quote showing the problem"
  ],
  "suggestions": [
    "Concrete, actionable tip they can apply in their next interview"
  ],
  "overallScore": <1-10>,
  "clarityScore": <1-10>,
  "structureScore": <1-10>,
  "relevanceScore": <1-10>,
  "confidenceScore": <1-10>,
  "summary": "2-3 sentence personalized summary referencing their specific answers"
}

SCORING GUIDE (calibrated to ${difficulty} difficulty):
- 1-3: Poor - major issues, would not advance
- 4-5: Below average - significant gaps
- 6-7: Average - acceptable but room to improve
- 8-9: Strong - would likely advance
- 10: Exceptional - top 5% of candidates

BE SPECIFIC. Quote their actual words. Generic feedback is worthless.
Return ONLY valid JSON, no markdown.`

  const result = await executeWithFallback<FeedbackResult>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are an interview coach. Respond only with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')

      const parsed = JSON.parse(jsonMatch[0])
      const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)))

      return {
        strengths: (parsed.strengths || []).slice(0, 4),
        improvements: (parsed.improvements || []).slice(0, 4),
        suggestions: (parsed.suggestions || []).slice(0, 4),
        overallScore: clamp(parsed.overallScore || 5),
        clarityScore: clamp(parsed.clarityScore || 5),
        structureScore: clamp(parsed.structureScore || 5),
        relevanceScore: clamp(parsed.relevanceScore || 5),
        confidenceScore: clamp(parsed.confidenceScore || 5),
        summary: parsed.summary || 'Feedback generation incomplete.',
        model: modelId,
        wasDegraded: false,
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
    ...result.data,
    model: result.model,
    wasDegraded: result.wasDegraded,
  }
}


