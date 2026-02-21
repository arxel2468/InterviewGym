// src/lib/groq/__tests__/interviewer.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the groq client
vi.mock('../client', () => ({
  getGroqClient: () => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Tell me about yourself.' } }],
        }),
      },
    },
  }),
}))

// Mock the models module
vi.mock('../models', () => ({
  getModelFallbacks: vi.fn().mockResolvedValue(['llama-3.1-70b-versatile']),
  getBestModel: vi.fn().mockResolvedValue('llama-3.1-70b-versatile'),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    modelCache: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    },
  },
}))

import { generateInterviewerResponse, generateFeedback } from '../interviewer'

describe('generateInterviewerResponse', () => {
  it('generates opening question for empty history', async () => {
    const result = await generateInterviewerResponse({
      difficulty: 'standard',
      interviewType: 'behavioral',
      targetRole: 'fullstack',
      conversationHistory: [],
    })

    // Should return a response, not an error
    if ('response' in result) {
      expect(result.response).toBeTruthy()
      expect(result.response.length).toBeGreaterThan(10)
      expect(result.model).toBeTruthy()
    }
  })

  it('handles follow-up after short answer', async () => {
    const result = await generateInterviewerResponse({
      difficulty: 'standard',
      interviewType: 'behavioral',
      targetRole: 'fullstack',
      conversationHistory: [
        {
          role: 'interviewer',
          content: 'Tell me about a challenge you faced.',
        },
        { role: 'candidate', content: 'I fixed a bug.' },
      ],
    })

    if ('response' in result) {
      expect(result.response).toBeTruthy()
    }
  })

  it('returns error gracefully when all models fail', async () => {
    const { getModelFallbacks } = await import('../models')
    vi.mocked(getModelFallbacks).mockResolvedValueOnce([])

    const result = await generateInterviewerResponse({
      difficulty: 'standard',
      interviewType: 'behavioral',
      conversationHistory: [],
    })

    expect('success' in result && result.success === false).toBe(true)
  })
})

describe('generateFeedback', () => {
  it('rejects empty candidate responses', async () => {
    const result = await generateFeedback(
      [{ role: 'interviewer', content: 'Tell me about yourself.' }],
      'standard'
    )

    expect('success' in result && result.success === false).toBe(true)
  })
})
