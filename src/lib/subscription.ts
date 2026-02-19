// src/lib/subscription.ts
import { prisma } from './prisma'
import { PLANS, PlanType } from './razorpay'

export async function getUserPlan(userId: string): Promise<{
  plan: PlanType
  sessionsPerDay: number
  features: string[]
  isActive: boolean
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription || subscription.status !== 'active' || new Date() > subscription.currentPeriodEnd) {
    return {
      plan: 'free',
      sessionsPerDay: 3,
      features: ['behavioral_only', 'basic_feedback', 'browser_tts'],
      isActive: true,
    }
  }

  const planConfig = PLANS[subscription.plan as keyof typeof PLANS]
  return {
    plan: subscription.plan as PlanType,
    sessionsPerDay: planConfig.sessionsPerDay,
    features: [...planConfig.features],
    isActive: true,
  }
}

export function canAccessFeature(features: string[], feature: string): boolean {
  return features.includes(feature)
}
