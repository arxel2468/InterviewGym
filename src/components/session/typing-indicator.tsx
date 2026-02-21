// src/components/session/typing-indicator.tsx

'use client'

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
    </div>
  )
}
