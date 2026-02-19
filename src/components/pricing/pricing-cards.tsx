// src/components/pricing/pricing-cards.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2, Zap, GraduationCap, Rocket } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: any
  }
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    icon: Zap,
    description: 'Get started with basics',
    features: [
      '3 sessions per day',
      'Behavioral interviews',
      'Basic feedback & scores',
      'Browser voice',
    ],
    limitations: [
      'No technical/HR interviews',
      'No resume-based questions',
      'No model answers',
    ],
  },
  {
    id: 'student',
    name: 'Student',
    price: 149,
    icon: GraduationCap,
    description: 'For serious preparation',
    popular: true,
    features: [
      '10 sessions per day',
      'All interview types',
      'Full feedback + model answers',
      'Natural AI voice',
      'Resume-based questions',
      'Job description mode',
    ],
    limitations: [],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 349,
    icon: Rocket,
    description: 'Maximum preparation',
    features: [
      'Unlimited sessions',
      'Everything in Student',
      'Priority voice (faster)',
      'Progress analytics',
      'Weekly email reports',
      'Priority support',
    ],
    limitations: [],
  },
]

export function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null)


  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/login'
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      if (response.status === 401) {
        // Not logged in — redirect to login with return URL
        window.location.href = `/login?redirect=/pricing&plan=${planId}`
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create subscription')
      }

      const data = await response.json()

      const options: RazorpayOptions = {
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: 'InterviewGym',
        description: data.name,
        handler: async (response: RazorpayResponse) => {
          // Verify payment on server
          try {
            await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
          } catch {
            // Webhook will handle it even if verify fails
          }
          toast.success('Subscription activated! 🎉')
          window.location.href = '/dashboard'
        },
        theme: { color: '#8b5cf6' },
        modal: {
          ondismiss: () => setLoading(null),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isPopular = 'popular' in plan && plan.popular

          return (
            <Card
              key={plan.id}
              className={`relative bg-zinc-900/50 border-zinc-800 ${
                isPopular ? 'border-violet-500 ring-1 ring-violet-500/20' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-medium bg-violet-600 text-white rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-violet-400" />
                </div>
                <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                <p className="text-sm text-zinc-400">{plan.description}</p>
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-white">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                      <span className="text-zinc-400 text-sm">/month</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full ${
                    isPopular
                      ? 'bg-gradient-primary hover:opacity-90'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
