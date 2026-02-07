// src/app/onboarding/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle bg-grid">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Interview<span className="text-gradient">Gym</span>
          </h1>
          <p className="text-zinc-400">
            Let's personalize your experience
          </p>
        </div>
        
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}
