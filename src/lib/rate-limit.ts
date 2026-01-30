import { prisma } from './prisma'

const DAILY_SESSION_LIMIT = 10 // Free tier limit

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sessionsToday = await prisma.session.count({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  return {
    allowed: sessionsToday < DAILY_SESSION_LIMIT,
    remaining: Math.max(0, DAILY_SESSION_LIMIT - sessionsToday),
    resetAt: tomorrow,
  }
}
