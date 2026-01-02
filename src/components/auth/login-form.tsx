'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Github, Mail, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const getRedirectUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/auth/callback`
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
      },
    })
    if (error) {
      toast.error('Failed to connect with Google')
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getRedirectUrl(),
      },
    })
    if (error) {
      toast.error('Failed to connect with GitHub')
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    })

    if (error) {
      toast.error('Failed to send login link')
    } else {
      toast.success('Check your email for the login link')
    }
    setLoading(false)
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl text-white">Get started</CardTitle>
        <CardDescription className="text-zinc-400">
          Sign in to track your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Logins */}
        <div className="space-y-3">
          {/* <Button
            variant="outline"
            className="w-full bg-white hover:bg-zinc-100 text-zinc-900 border-0"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button> */}

          <Button
            variant="outline"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
            onClick={handleGitHubLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Github className="w-4 h-4 mr-2" />
            )}
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
          </div>
        </div>

        {/* Magic Link */}
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={loading || !email}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send login link
          </Button>
        </form>

        <p className="text-xs text-center text-zinc-500 pt-2">
          By continuing, you agree to our Terms of Service
        </p>
      </CardContent>
    </Card>
  )
}
