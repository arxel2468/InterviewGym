// src/lib/data/sessions.ts
import { prisma } from '@/lib/prisma'
import { cache } from 'react'

export const getRecentSessions = cache(async (userId: string, limit = 5) => {
  return prisma.session.findMany({
    where: { userId, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    take: limit,
    include: { metrics: true },
  })
})

export const getActiveSession = cache(async (userId: string) => {
  return prisma.session.findFirst({
    where: { userId, status: 'in_progress' },
    orderBy: { startedAt: 'desc' },
  })
})

export const getSessionWithFeedback = cache(async (sessionId: string, userId: string) => {
  return prisma.session.findUnique({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { orderIndex: 'asc' } },
      metrics: true,
      feedback: true,
    },
  })
})

export const getUserStats = cache(async (userId: string) => {
  const [sessions, avgScore] = await Promise.all([
    prisma.session.count({ where: { userId, status: 'completed' } }),
    prisma.metrics.aggregate({
      where: { session: { userId } },
      _avg: { overallScore: true },
    }),
  ])
  return { totalSessions: sessions, averageScore: avgScore._avg.overallScore }
})
