import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = createClient()
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError || !data.user) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${origin}/login?error=session_error`)
    }

    const dbUser = await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.user_metadata?.user_name,
        avatarUrl: data.user.user_metadata?.avatar_url,
      },
      create: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.user_metadata?.user_name,
        avatarUrl: data.user.user_metadata?.avatar_url,
      },
    })

    const redirectUrl = dbUser.onboardingComplete ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(`${origin}${redirectUrl}`)
  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(`${origin}/login?error=unexpected`)
  }
}