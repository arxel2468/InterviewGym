import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const user = await requireAuth()

  if (user.onboardingComplete) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle bg-grid">
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Quick setup
          </h1>
          <p className="text-zinc-400">
            Help us personalize your experience
          </p>
        </div>

        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}
