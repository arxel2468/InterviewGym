// src/lib/razorpay.ts
import Razorpay from 'razorpay'

let razorpayClient: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return razorpayClient
}

export const PLANS = {
  student: {
    name: 'Student',
    price: 14900, // ₹149 in paise
    razorpayPlanId: process.env.RAZORPAY_STUDENT_PLAN_ID!,
    sessionsPerDay: 10,
    features: ['all_types', 'full_feedback', 'cloud_tts', 'resume', 'jd_mode'],
  },
  pro: {
    name: 'Pro',
    price: 34900, // ₹349 in paise
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID!,
    sessionsPerDay: 999,
    features: [
      'all_types',
      'full_feedback',
      'cloud_tts',
      'resume',
      'jd_mode',
      'priority_voice',
      'analytics',
      'email_reports',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS | 'free'
