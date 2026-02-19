// src/app/pricing/page.tsx
import { PricingCards } from '@/components/pricing/pricing-cards'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Reuse landing page nav or create a shared nav */}
      <div className="container mx-auto px-4 max-w-6xl py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, student-friendly pricing
          </h1>
          <p className="text-zinc-400 text-lg">
            Start free. Upgrade when you're serious about landing the job.
          </p>
        </div>
        <PricingCards />
      </div>
    </div>
  )
}
