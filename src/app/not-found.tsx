import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B]">
      <div className="max-w-md px-4 text-center">
        <h1 className="text-gradient mb-4 text-8xl font-bold">404</h1>
        <h2 className="mb-2 text-xl font-semibold text-white">
          Page not found
        </h2>
        <p className="mb-8 text-zinc-400">
          Looks like this interview room doesn't exist. Let's get you back on
          track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="border-zinc-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-gradient-primary hover:opacity-90">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
