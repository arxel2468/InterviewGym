// src/app/api/payment/webhook/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const sub = event.payload.subscription.entity
        const userId = sub.notes?.userId

        if (!userId) break

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            status: 'active',
            razorpaySubId: sub.id,
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
          create: {
            userId,
            plan: sub.notes.plan || 'student',
            status: 'active',
            razorpaySubId: sub.id,
            razorpayCustomerId: sub.customer_id,
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        })
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const sub = event.payload.subscription.entity
        await prisma.subscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: {
            status: event.event === 'subscription.cancelled' ? 'cancelled' : 'expired',
            cancelledAt: new Date(),
          },
        })
        break
      }

      case 'payment.captured': {
        const payment = event.payload.payment.entity
        await prisma.payment.create({
          data: {
            userId: payment.notes?.userId || 'unknown',
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: 'captured',
          },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
