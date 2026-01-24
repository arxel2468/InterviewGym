import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors (including from URL hash)
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()

    // Verify supabase client was created
    if (!supabase || !supabase.auth) {
      console.error('Supabase client not properly initialized')
      return NextResponse.redirect(`${origin}/login?error=auth_init_failed`)
    }

    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Session exchange error:', sessionError.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(sessionError.message)}`)
    }

    if (!data.user) {
      console.error('No user returned from session exchange')
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    // Upsert user in database
    const dbUser = await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.user_metadata?.user_name ||
              null,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
      },
      create: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.user_metadata?.user_name ||
              null,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
      },
    })

    const redirectUrl = dbUser.onboardingComplete ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(`${origin}${redirectUrl}`)
  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(`${origin}/login?error=unexpected`)
  }
}
