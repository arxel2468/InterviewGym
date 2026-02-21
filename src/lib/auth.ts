import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function getUser() {
  const supabase = await createClient() // ADD await
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { resume: true },
  })

  if (!dbUser) {
    redirect('/login')
  }

  return dbUser
}

export async function requireOnboarding() {
  const user = await requireAuth()

  if (!user.onboardingComplete) {
    redirect('/onboarding')
  }

  return user
}
