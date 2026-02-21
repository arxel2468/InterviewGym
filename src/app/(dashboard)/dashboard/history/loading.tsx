import { Loader2 } from 'lucide-react'

export default function HistoryLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-zinc-400">Loading history...</p>
      </div>
    </div>
  )
}
