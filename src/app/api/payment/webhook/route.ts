// src/app/api/payment/webhook/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    // Verify webhook signature
    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      logger.error('Webhook: missing signature or secret')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      logger.error('Webhook: signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.event

    logger.info('Webhook received', { event: eventType })

    switch (eventType) {
      case 'subscription.activated': {
        const sub = event.payload.subscription.entity
        const userId = sub.notes?.userId

        if (!userId) {
          logger.error('Webhook: no userId in subscription notes', { subId: sub.id })
          break
        }

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: sub.notes.plan || 'student',
            status: 'active',
            razorpaySubId: sub.id,
            razorpayCustomerId: sub.customer_id || null,
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
          create: {
            userId,
            plan: sub.notes.plan || 'student',
            status: 'active',
            razorpaySubId: sub.id,
            razorpayCustomerId: sub.customer_id || null,
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        })

        logger.info('Subscription activated', { userId, plan: sub.notes.plan })
        break
      }

      case 'subscription.charged': {
        const sub = event.payload.subscription.entity
        const payment = event.payload.payment?.entity
        const userId = sub.notes?.userId

        if (!userId) break

        // Update subscription period
        await prisma.subscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: {
            status: 'active',
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        })

        // Record payment
        if (payment) {
          await prisma.payment.upsert({
            where: { razorpayPaymentId: payment.id },
            update: {
              amount: payment.amount,
              status: 'captured',
            },
            create: {
              userId,
              subscriptionId: sub.id,
              razorpayPaymentId: payment.id,
              razorpayOrderId: payment.order_id || null,
              amount: payment.amount,
              currency: payment.currency || 'INR',
              status: 'captured',
            },
          })
        }

        logger.info('Subscription charged', { userId, amount: payment?.amount })
        break
      }

      case 'subscription.cancelled': {
        const sub = event.payload.subscription.entity

        await prisma.subscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        })

        logger.info('Subscription cancelled', { subId: sub.id })
        break
      }

      case 'subscription.expired': {
        const sub = event.payload.subscription.entity

        await prisma.subscription.updateMany({
          where: { razorpaySubId: sub.id },
          data: {
            status: 'expired',
          },
        })

        logger.info('Subscription expired', { subId: sub.id })
        break
      }

      case 'payment.captured': {
        const payment = event.payload.payment.entity
        const userId = payment.notes?.userId

        if (userId) {
          await prisma.payment.upsert({
            where: { razorpayPaymentId: payment.id },
            update: {
              amount: payment.amount,
              status: 'captured',
            },
            create: {
              userId,
              razorpayPaymentId: payment.id,
              razorpayOrderId: payment.order_id || null,
              amount: payment.amount,
              currency: payment.currency || 'INR',
              status: 'captured',
            },
          })
        }

        logger.info('Payment captured', { paymentId: payment.id, amount: payment.amount })
        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity
        const userId = payment.notes?.userId

        if (userId) {
          await prisma.payment.create({
            data: {
              userId,
              razorpayPaymentId: payment.id,
              razorpayOrderId: payment.order_id || null,
              amount: payment.amount || 0,
              currency: payment.currency || 'INR',
              status: 'failed',
            },
          })
        }

        logger.warn('Payment failed', {
          paymentId: payment.id,
          reason: payment.error_description,
        })
        break
      }

      default:
        logger.info('Webhook: unhandled event', { event: eventType })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook processing error', { error: String(error) })
    // Return 200 even on error to prevent Razorpay from retrying endlessly
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}
