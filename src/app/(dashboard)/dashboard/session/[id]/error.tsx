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
    <div className="max-w-xl mx-auto mt-20">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-2">
              Interview Connection Lost
            </h2>
            
            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
              Something went wrong with your interview session. This could be a network issue or a temporary problem on our end.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                onClick={reset}
                className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="border-zinc-700 w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            {error.digest && (
              <p className="text-xs text-zinc-600 mt-6">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
