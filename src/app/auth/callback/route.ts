import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors (including from URL hash)
  if (error) {
    logger.error('OAuth error:', { error, errorDescription })
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    logger.error('No code provided in callback')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()

    // Verify supabase client was created
    if (!supabase || !supabase.auth) {
      logger.error('Supabase client not properly initialized')
      return NextResponse.redirect(`${origin}/login?error=auth_init_failed`)
    }

    const { data, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      logger.error('Session exchange error:', { message: sessionError.message })
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(sessionError.message)}`
      )
    }

    if (!data.user) {
      logger.error('No user returned from session exchange')
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    // Upsert user in database
    const dbUser = await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email!,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.user_metadata?.user_name ||
          null,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
      },
      create: {
        id: data.user.id,
        email: data.user.email!,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.user_metadata?.user_name ||
          null,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
      },
    })

    const redirectUrl = dbUser.onboardingComplete ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(`${origin}${redirectUrl}`)
  } catch (err) {
    logger.error('Callback error:', { error: String(err) })
    return NextResponse.redirect(`${origin}/login?error=unexpected`)
  }
}
