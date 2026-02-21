'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Session error:', error)
  }, [error])

  return (
    <div className="mx-auto mt-20 max-w-xl">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="pb-8 pt-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-white">
              Interview Connection Lost
            </h2>

            <p className="mx-auto mb-8 max-w-sm text-zinc-400">
              Something went wrong with your interview session. This could be a
              network issue or a temporary problem on our end.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={reset}
                className="bg-gradient-primary w-full hover:opacity-90 sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-zinc-700">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {error.digest && (
              <p className="mt-6 text-xs text-zinc-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
