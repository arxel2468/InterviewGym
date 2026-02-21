// src/app/onboarding/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user exists and already completed onboarding
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (dbUser?.onboardingComplete) {
    redirect('/dashboard')
  }

  return (
    <div className="bg-gradient-subtle bg-grid flex min-h-screen items-center justify-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Welcome to Interview<span className="text-gradient">Gym</span>
          </h1>
          <p className="text-zinc-400">Let's personalize your experience</p>
        </div>

        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}
