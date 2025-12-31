import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function GET() {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  // Check what's available on the groq object
  const available = {
    hasChat: typeof groq.chat !== 'undefined',
    hasChatCompletions: typeof groq.chat?.completions !== 'undefined',
    hasAudio: typeof groq.audio !== 'undefined',
    hasAudioTranscriptions: typeof (groq.audio as any)?.transcriptions !== 'undefined',
    hasAudioSpeech: typeof (groq.audio as any)?.speech !== 'undefined',
    audioKeys: groq.audio ? Object.keys(groq.audio) : [],
  }

  return NextResponse.json(available)
}