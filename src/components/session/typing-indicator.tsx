// src/components/session/typing-indicator.tsx

'use client'

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
    </div>
  )
}
