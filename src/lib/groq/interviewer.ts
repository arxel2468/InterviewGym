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
        ? `\nCANDIDATE BACKGROUND:\n${context.resumeContext}\nReference their specific experiences when relevant.`
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

  const candidateResponses = conversationHistory
    .filter((m) => m.role === 'candidate')
    .map((m) => m.content)
    .join('\n\n')

  if (!candidateResponses.trim()) {
    return {
      success: false,
      error: 'No candidate responses to analyze',
      friendlyMessage: "We couldn't find any responses to analyze. Did you complete the interview?",
    }
  }

  const prompt = `Analyze this interview candidate's responses and provide structured feedback.

CANDIDATE'S RESPONSES:
${candidateResponses}

DIFFICULTY LEVEL: ${difficulty}

Provide feedback in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area to improve 1", "area to improve 2"],
  "suggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2"],
  "overallScore": <1-10>,
  "clarityScore": <1-10>,
  "structureScore": <1-10>,
  "relevanceScore": <1-10>,
  "summary": "2-3 sentence overall assessment"
}

SCORING GUIDE:
- 1-3: Poor, significant issues
- 4-5: Below average, needs work
- 6-7: Average to good
- 8-9: Very good
- 10: Exceptional

Be honest and specific. Generic feedback is useless.`

  const result = await executeWithFallback<FeedbackResult>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Respond only with valid JSON, no markdown code blocks.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate required fields
      if (
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.improvements) ||
        typeof parsed.overallScore !== 'number'
      ) {
        throw new Error('Invalid feedback structure')
      }

      return {
        ...parsed,
        model: modelId,
        wasDegraded: false, // Will be overwritten
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