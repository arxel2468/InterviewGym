// src/app/api/payment/verify/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_subscription_id: z.string(),
  razorpay_signature: z.string(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      schema.parse(body)

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      logger.error('Payment signature verification failed', {
        userId: user.id,
        paymentId: razorpay_payment_id,
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Record payment
    await prisma.payment.create({
      data: {
        userId: user.id,
        razorpayPaymentId: razorpay_payment_id,
        amount: 0, // Will be updated by webhook
        status: 'captured',
      },
    })

    logger.info('Payment verified', {
      userId: user.id,
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
    })

    return NextResponse.json({ verified: true })
  } catch (error) {
    logger.error('Payment verification error', { error: String(error) })
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
