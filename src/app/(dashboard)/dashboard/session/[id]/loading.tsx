import { Loader2 } from 'lucide-react'

export default function SessionLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Connecting to interviewer...</p>
      </div>
    </div>
  )
}