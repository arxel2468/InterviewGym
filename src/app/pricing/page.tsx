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
    if (subscription?.status === 'active' && new Date() < subscription.currentPeriodEnd) {
      currentPlan = subscription.plan
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Navigation */}
      <nav className="border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-white">
              Interview<span className="text-gradient">Gym</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 max-w-6xl py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, student-friendly pricing
          </h1>
          <p className="text-zinc-400 text-lg">
            Start free. Upgrade when you're serious about landing the job.
          </p>
        </div>

        <PricingCards isLoggedIn={!!user} currentPlan={currentPlan} />

        <div className="text-center mt-12">
          <p className="text-zinc-500 text-sm">
            All plans include a 7-day money-back guarantee.
            <br />
            Prices are in INR. Cancel anytime from settings.
          </p>
        </div>
      </div>
    </div>
  )
}
