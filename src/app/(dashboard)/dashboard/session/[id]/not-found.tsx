import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, Home, Plus } from 'lucide-react'

export default function SessionNotFound() {
  return (
    <div className="mx-auto mt-20 max-w-xl">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="pb-8 pt-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <FileQuestion className="h-8 w-8 text-zinc-500" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-white">
              Session Not Found
            </h2>

            <p className="mx-auto mb-8 max-w-sm text-zinc-400">
              This interview session doesn't exist or you don't have access to
              it.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/dashboard/session/new" className="w-full sm:w-auto">
                <Button className="bg-gradient-primary w-full hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Session
                </Button>
              </Link>

              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-zinc-700">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
