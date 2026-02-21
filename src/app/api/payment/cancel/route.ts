// src/app/api/payment/cancel/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getRazorpay } from '@/lib/razorpay'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription || !subscription.razorpaySubId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      )
    }

    // Cancel in Razorpay
    const razorpay = getRazorpay()
    await razorpay.subscriptions.cancel(subscription.razorpaySubId)

    // Update in DB — keep active until period ends
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    })

    logger.info('Subscription cancelled', { userId: user.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Cancel subscription error', { error: String(error) })
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
  }
}
