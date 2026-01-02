import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-8xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">
          Page not found
        </h2>
        <p className="text-zinc-400 mb-8">
          Looks like this interview room doesn't exist. Let's get you back on track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="border-zinc-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-gradient-primary hover:opacity-90">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}