import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInterviewerResponse, Difficulty } from '@/lib/groq/interviewer'
import { z } from 'zod'

const requestSchema = z.object({
  difficulty: z.enum(['warmup', 'standard', 'intense']),
  interviewType: z.string(),
  targetRole: z.string().optional(),
  resumeContext: z.string().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['interviewer', 'candidate']),
      content: z.string(),
    })
  ),
})

export async function POST(request: Request) {
  try {
    // Verify auth
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const context = requestSchema.parse(body)

    // Generate response with fallback
    const result = await generateInterviewerResponse({
      difficulty: context.difficulty as Difficulty,
      interviewType: context.interviewType,
      targetRole: context.targetRole,
      resumeContext: context.resumeContext,
      conversationHistory: context.conversationHistory,
    })
    
    // Check if it's an error result
    if ('success' in result && result.success === false) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Interview response error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate response',
        friendlyMessage: "The interviewer is stuck in another meeting. Please try again in a moment."
      },
      { status: 500 }
    )
  }
}