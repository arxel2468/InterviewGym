// src/app/pricing/page.tsx

import { createClient } from '@/lib/supabase/server'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlan = 'free'
  if (user) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })
    if (
      subscription?.status === 'active' &&
      new Date() < subscription.currentPeriodEnd
    ) {
      currentPlan = subscription.plan
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-white">
              Interview<span className="text-gradient">Gym</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Simple, student-friendly pricing
          </h1>
          <p className="text-lg text-zinc-400">
            Start free. Upgrade when you're serious about landing the job.
          </p>
        </div>

        <PricingCards isLoggedIn={!!user} currentPlan={currentPlan} />

        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500">
            All plans include a 7-day money-back guarantee.
            <br />
            Prices are in INR. Cancel anytime from settings.
          </p>
        </div>
      </div>
    </div>
  )
}
