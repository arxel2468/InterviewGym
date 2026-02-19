// src/lib/rate-limit.test.ts — REPLACE ENTIRE FILE

import { describe, it, expect, vi } from 'vitest'

vi.mock('./prisma', () => ({
  prisma: {
    session: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

vi.mock('./subscription', () => ({
  getUserPlan: vi.fn().mockResolvedValue({
    plan: 'free',
    sessionsPerDay: 3,
    features: [],
    isActive: true,
  }),
}))

import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  it('allows first session of the day', async () => {
    const result = await checkRateLimit('user-123')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(3)
  })

  it('returns plan info', async () => {
    const result = await checkRateLimit('user-123')
    expect(result.plan).toBe('free')
  })

  it('blocks when limit reached', async () => {
    const { prisma } = await import('./prisma')
    vi.mocked(prisma.session.count).mockResolvedValueOnce(3)

    const result = await checkRateLimit('user-456')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})
