import { getGroqClient } from './client'
import { executeWithFallback, getDegradedMessage } from './fallback'

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
}

export type InterviewerResponse = {
  response: string
  model: string
  wasDegraded: boolean
  degradedMessage?: string
}

export type InterviewerError = {
  success: false
  error: string
  friendlyMessage: string
}

// ============================================
// PROMPTS
// ============================================

const DIFFICULTY_PROMPTS: Record<Difficulty, string> = {
  warmup: `You are a friendly, encouraging interviewer. 
- Give the candidate time to think
- Offer gentle prompts if they seem stuck
- Focus on making them comfortable
- Acknowledge good points they make
- Keep follow-up questions simple`,

  standard: `You are a professional, neutral interviewer.
- Ask clear, direct questions
- Probe for depth when answers are surface-level
- Maintain a business-like tone
- Don't offer hints or help
- Follow up on vague statements`,

  intense: `You are a demanding, rigorous interviewer.
- Challenge weak answers immediately
- Ask "why" repeatedly to test depth
- Show subtle skepticism
- Create pressure through brief responses
- Don't accept generic answers`,
}

const SYSTEM_PROMPT = `You are an AI interviewer conducting a behavioral interview for a tech role.

CORE BEHAVIORS:
1. Ask ONE question at a time
2. Listen to the response and ask relevant follow-ups
3. Never break character as an interviewer
4. Keep responses concise (2-3 sentences max for follow-ups)
5. After 5-7 exchanges, naturally conclude the interview

QUESTION TYPES TO COVER:
- "Tell me about yourself" (opening)
- Behavioral: "Tell me about a time when..."
- Problem-solving: "How would you approach..."
- Self-awareness: "What's your biggest weakness..."
- Motivation: "Why are you interested in..."

RESPONSE FORMAT:
- Speak naturally as an interviewer would
- No asterisks, markdown, or stage directions
- No excessive praise like "Great answer!"
- Brief acknowledgments are okay: "I see." or "Interesting."

{DIFFICULTY_INSTRUCTIONS}

{RESUME_CONTEXT}`

// Update the resume context injection in generateInterviewerResponse:
const systemPrompt = SYSTEM_PROMPT
  .replace('{DIFFICULTY_INSTRUCTIONS}', DIFFICULTY_PROMPTS[context.difficulty])
  .replace(
    '{RESUME_CONTEXT}',
    context.resumeContext
      ? `\nCANDIDATE BACKGROUND (from their resume):\n${context.resumeContext}\n\nSTRICT RULE: Only reference experiences, projects, and skills that appear in the list above. Do not invent or assume additional projects or experiences.`
      : ''
  )

// ============================================
// GENERATE RESPONSE
// ============================================

export async function generateInterviewerResponse(
  context: InterviewContext,
  onRetry?: (message: string, attempt: number) => void
): Promise<InterviewerResponse | InterviewerError> {
  const groq = getGroqClient()

  const systemPrompt = SYSTEM_PROMPT
    .replace('{DIFFICULTY_INSTRUCTIONS}', DIFFICULTY_PROMPTS[context.difficulty])
    .replace(
      '{RESUME_CONTEXT}',
      context.resumeContext
        ? `\nCANDIDATE BACKGROUND (from their resume):\n${context.resumeContext}\n\nSTRICT RULE: Only reference experiences, projects, and skills that appear in the list above. Do not invent or assume additional projects or experiences.`
        : ''
    )

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Convert conversation history to LLM format
  for (const msg of context.conversationHistory) {
    messages.push({
      role: msg.role === 'interviewer' ? 'assistant' : 'user',
      content: msg.content,
    })
  }

  // If this is the start, generate opening
  if (context.conversationHistory.length === 0) {
    messages.push({
      role: 'user',
      content: 'The interview is starting. Please introduce yourself briefly and ask your first question.',
    })
  }

  const result = await executeWithFallback<string>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 256,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('Empty response from model')
      }

      return response
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
    response: result.data,
    model: result.model,
    wasDegraded: result.wasDegraded,
    degradedMessage: result.wasDegraded ? getDegradedMessage('chat') : undefined,
  }
}

// ============================================
// GENERATE FEEDBACK
// ============================================

export type FeedbackResult = {
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  overallScore: number
  clarityScore: number
  structureScore: number
  relevanceScore: number
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

  // Build a detailed transcript
  const transcript = conversationHistory
    .map((m, i) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n')

  const candidateResponses = conversationHistory
    .filter((m) => m.role === 'candidate')
    .map((m) => m.content)

  if (candidateResponses.length === 0) {
    return {
      success: false,
      error: 'No candidate responses to analyze',
      friendlyMessage: "We couldn't find any responses to analyze. Did you complete the interview?",
    }
  }

  const prompt = `You are an expert interview coach analyzing a practice interview session.

FULL TRANSCRIPT:
${transcript}

INTERVIEW CONTEXT:
- Difficulty: ${difficulty}
- Total responses: ${candidateResponses.length}

ANALYSIS INSTRUCTIONS:
1. Evaluate each candidate response for:
   - Clarity: Was the answer easy to follow?
   - Structure: Did they use frameworks like STAR (Situation, Task, Action, Result)?
   - Relevance: Did they actually answer the question asked?
   - Confidence: Did they sound certain or hedge excessively?

2. Look for specific issues:
   - Vague statements without examples
   - Missing outcomes/results
   - Rambling or unfocused answers
   - Filler words and hedging language
   - Not answering the actual question

3. Identify concrete strengths with evidence from their answers.

4. Provide actionable suggestions they can apply immediately.

RESPOND WITH THIS EXACT JSON FORMAT (no markdown, no code blocks):
{
  "strengths": [
    "Specific strength with example from their answer",
    "Another specific strength"
  ],
  "improvements": [
    "Specific issue: quote or reference what they said",
    "Another specific issue with evidence"
  ],
  "suggestions": [
    "Actionable tip: exactly what to do differently",
    "Another concrete suggestion"
  ],
  "overallScore": <1-10>,
  "clarityScore": <1-10>,
  "structureScore": <1-10>,
  "relevanceScore": <1-10>,
  "confidenceScore": <1-10>,
  "summary": "2-3 sentence personalized assessment referencing their specific answers"
}

SCORING SCALE:
1-3: Poor - Major issues, answer was confusing or off-topic
4-5: Below Average - Some relevant points but significant gaps
6-7: Average - Acceptable answer with room for improvement
8-9: Strong - Well-structured, specific, answered the question
10: Exceptional - Memorable answer that would impress any interviewer

BE SPECIFIC. Reference their actual words. Generic feedback is useless.
For ${difficulty} difficulty, calibrate expectations accordingly.`

  const result = await executeWithFallback<FeedbackResult>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Respond only with valid JSON. No markdown formatting.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'

      // Extract JSON from response (handle potential markdown wrapping)
      let jsonString = responseText
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      const parsed = JSON.parse(jsonString)

      // Validate required fields
      if (
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.improvements) ||
        !Array.isArray(parsed.suggestions) ||
        typeof parsed.overallScore !== 'number' ||
        typeof parsed.summary !== 'string'
      ) {
        throw new Error('Invalid feedback structure')
      }

      // Ensure scores are within range
      const clampScore = (s: number) => Math.max(1, Math.min(10, Math.round(s)))

      return {
        strengths: parsed.strengths.slice(0, 5),
        improvements: parsed.improvements.slice(0, 5),
        suggestions: parsed.suggestions.slice(0, 5),
        overallScore: clampScore(parsed.overallScore),
        clarityScore: clampScore(parsed.clarityScore || parsed.overallScore),
        structureScore: clampScore(parsed.structureScore || parsed.overallScore),
        relevanceScore: clampScore(parsed.relevanceScore || parsed.overallScore),
        confidenceScore: clampScore(parsed.confidenceScore || parsed.overallScore),
        summary: parsed.summary,
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
