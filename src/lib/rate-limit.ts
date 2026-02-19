import { prisma } from './prisma'
import { getUserPlan } from './subscription'

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
  plan: string
}> {
  const userPlan = await getUserPlan(userId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sessionsToday = await prisma.session.count({
    where: {
      userId,
      createdAt: { gte: today, lt: tomorrow },
    },
  })

  const limit = userPlan.sessionsPerDay

  return {
    allowed: sessionsToday < limit,
    remaining: Math.max(0, limit - sessionsToday),
    resetAt: tomorrow,
    plan: userPlan.plan,
  }
}
