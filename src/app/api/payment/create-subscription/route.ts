// src/app/api/payment/create-subscription/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay, PLANS } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  plan: z.enum(['student', 'pro']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = schema.parse(body)
    const planConfig = PLANS[plan]

    const razorpay = getRazorpay()

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planConfig.razorpayPlanId,
      customer_notify: 1,
      total_count: 12, // 12 months max
      notes: {
        userId: user.id,
        plan: plan,
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: planConfig.price,
      currency: 'INR',
      name: `InterviewGym ${planConfig.name}`,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
