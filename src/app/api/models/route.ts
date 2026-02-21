import { NextResponse } from 'next/server'
import { getModelRankings, forceRefreshCache } from '@/lib/groq/models'
import { createClient } from '@/lib/supabase/server'

// GET: Retrieve current model rankings
export async function GET() {
  try {
    const rankings = await getModelRankings()

    return NextResponse.json({
      success: true,
      rankings: {
        stt: rankings.stt,
        tts: rankings.tts,
        chat: rankings.chat,
      },
      meta: {
        totalModels: rankings.raw.length,
        updatedAt: rankings.updatedAt,
        expiresAt: rankings.expiresAt,
        cacheAgeMinutes: Math.round(
          (Date.now() - new Date(rankings.updatedAt).getTime()) / 1000 / 60
        ),
      },
    })
  } catch (error: any) {
    console.error('Failed to get model rankings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get models',
      },
      { status: 500 }
    )
  }
}

// POST: Force refresh the cache
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rankings = await forceRefreshCache()

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      rankings: {
        stt: rankings.stt,
        tts: rankings.tts,
        chat: rankings.chat,
      },
      meta: {
        totalModels: rankings.raw.length,
        updatedAt: rankings.updatedAt,
        expiresAt: rankings.expiresAt,
      },
    })
  } catch (error: any) {
    console.error('Failed to refresh model cache:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to refresh cache',
      },
      { status: 500 }
    )
  }
}
