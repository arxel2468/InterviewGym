// src/app/api/payment/create-subscription/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay, PLANS } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  plan: z.enum(['student', 'pro']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in first', requiresAuth: true },
        { status: 401 }
      )
    }

    // Check if user already has active subscription
    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (existing && existing.status === 'active' && new Date() < existing.currentPeriodEnd) {
      return NextResponse.json(
        { error: 'You already have an active subscription', currentPlan: existing.plan },
        { status: 409 }
      )
    }

    const body = await request.json()
    const { plan } = schema.parse(body)
    const planConfig = PLANS[plan]

    const razorpay = getRazorpay()

    // Get user details for prefill
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    const subscription = await razorpay.subscriptions.create({
      plan_id: planConfig.razorpayPlanId,
      customer_notify: 1,
      total_count: 12,
      notes: {
        userId: user.id,
        plan: plan,
        email: user.email || '',
      },
    })

    logger.info('Subscription created', {
      userId: user.id,
      plan,
      subscriptionId: subscription.id,
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: planConfig.price,
      currency: 'INR',
      name: `InterviewGym ${planConfig.name}`,
      prefill: {
        name: dbUser?.name || '',
        email: user.email || '',
      },
    })
  } catch (error) {
    logger.error('Create subscription error', { error: String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
