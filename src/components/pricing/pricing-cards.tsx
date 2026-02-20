'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2, Zap, GraduationCap, Rocket, X } from 'lucide-react'
import { toast } from 'sonner'

interface PricingCardsProps {
  isLoggedIn: boolean
  currentPlan: string
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
    excluded: [
      'Technical/HR/System Design interviews',
      'Resume-based questions',
      'Natural AI voice',
      'Model answers',
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
      'English fluency analysis',
    ],
    excluded: [],
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
      'Priority support',
    ],
    excluded: [],
  },
]

export function PricingCards({ isLoggedIn, currentPlan }: PricingCardsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    // Free plan — just go to signup or dashboard
    if (planId === 'free') {
      router.push(isLoggedIn ? '/dashboard' : '/login')
      return
    }

    // Must be logged in to pay
    if (!isLoggedIn) {
      toast.info('Please sign in first to subscribe')
      router.push(`/login`)
      return
    }

    // Already on this plan
    if (currentPlan === planId) {
      toast.info("You're already on this plan!")
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await response.json()

      if (response.status === 401) {
        toast.error('Please sign in first')
        router.push('/login')
        return
      }

      if (response.status === 409) {
        toast.info('You already have an active subscription')
        router.push('/dashboard')
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Check if Razorpay is loaded
      if (typeof window === 'undefined' || !window.Razorpay) {
        // Try loading it
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load payment system'))
          document.body.appendChild(script)
        })
      }

      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: 'InterviewGym',
        description: data.name,
        prefill: data.prefill,
        handler: async (response) => {
          // Verify on server
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (verifyRes.ok) {
              toast.success('Subscription activated! 🎉')
            } else {
              // Payment went through but verification failed
              // Webhook will handle it
              toast.success('Payment received! Your plan will activate shortly.')
            }
          } catch {
            toast.success('Payment received! Your plan will activate shortly.')
          }

          router.push('/dashboard')
          router.refresh()
        },
        theme: { color: '#8b5cf6' },
        modal: {
          ondismiss: () => {
            setLoading(null)
          },
        },
      })

      rzp.on('payment.failed', (response: unknown) => {
        setLoading(null)
        const failedResponse = response as { error?: { description?: string } }
        const errorMessage = failedResponse?.error?.description || 'Payment failed'
        toast.error(errorMessage)
      })

      rzp.open()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
      setLoading(null)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {PLANS.map((plan) => {
        const Icon = plan.icon
        const isPopular = 'popular' in plan && plan.popular
        const isCurrentPlan = currentPlan === plan.id
        const isDowngrade =
          (currentPlan === 'pro' && plan.id !== 'pro') ||
          (currentPlan === 'student' && plan.id === 'free')

        return (
          <Card
            key={plan.id}
            className={`relative bg-zinc-900/50 ${
              isPopular
                ? 'border-violet-500 ring-1 ring-violet-500/20'
                : isCurrentPlan
                  ? 'border-green-500/50'
                  : 'border-zinc-800'
            }`}
          >
            {isPopular && !isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-medium bg-violet-600 text-white rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            {isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-full">
                  Current Plan
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
              {/* Included features */}
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Excluded features (for free plan) */}
              {'excluded' in plan && plan.excluded.length > 0 && (
                <ul className="space-y-2 pt-2 border-t border-zinc-800">
                  {plan.excluded.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || isCurrentPlan || isDowngrade}
                className={`w-full ${
                  isCurrentPlan
                    ? 'bg-green-600/20 text-green-400 cursor-default'
                    : isPopular
                      ? 'bg-gradient-primary hover:opacity-90'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : isDowngrade ? (
                  'Contact Support'
                ) : plan.price === 0 ? (
                  isLoggedIn ? 'Current Plan' : 'Get Started'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
