import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, Home, Plus } from 'lucide-react'

export default function SessionNotFound() {
  return (
    <div className="max-w-xl mx-auto mt-20">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <FileQuestion className="w-8 h-8 text-zinc-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-2">
              Session Not Found
            </h2>
            
            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
              This interview session doesn't exist or you don't have access to it.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard/session/new" className="w-full sm:w-auto">
                <Button className="bg-gradient-primary hover:opacity-90 w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Session
                </Button>
              </Link>
              
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
