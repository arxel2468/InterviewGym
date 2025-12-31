import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'

// Types
export type ModelCategory = 'stt' | 'tts' | 'chat'

export type GroqModel = {
  id: string
  object: string
  created: number
  owned_by: string
  active: boolean
  context_window: number
  max_completion_tokens: number
}

export type ModelRankings = {
  stt: string[]
  tts: string[]
  chat: string[]
  raw: GroqModel[]
  updatedAt: Date
  expiresAt: Date
}

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000

// ============================================
// MODEL IDENTIFICATION
// ============================================

function isSTTModel(model: GroqModel): boolean {
  const id = model.id.toLowerCase()
  return id.includes('whisper')
}

function isTTSModel(model: GroqModel): boolean {
  const id = model.id.toLowerCase()
  return id.includes('tts') || id.includes('orpheus')
}

function isSafetyModel(model: GroqModel): boolean {
  const id = model.id.toLowerCase()
  return id.includes('guard') || id.includes('safeguard') || id.includes('safety')
}

function isChatModel(model: GroqModel): boolean {
  // Must have reasonable context window for conversation
  // Must NOT be STT, TTS, or safety model
  return (
    model.context_window > 4096 &&
    model.max_completion_tokens > 1000 &&
    !isSTTModel(model) &&
    !isTTSModel(model) &&
    !isSafetyModel(model)
  )
}

// ============================================
// MODEL RANKING
// ============================================

function extractParameterCount(modelId: string): number {
  // Extract numbers followed by 'b' (billion) from model name
  // e.g., "llama-3.3-70b-versatile" -> 70
  // e.g., "qwen3-32b" -> 32
  const match = modelId.toLowerCase().match(/(\d+)b/)
  return match ? parseInt(match[1], 10) : 0
}

function extractVersionNumber(modelId: string): number {
  // Extract version numbers like v3, v2, etc.
  const match = modelId.toLowerCase().match(/v(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function rankSTTModels(models: GroqModel[]): string[] {
  const sttModels = models.filter(isSTTModel)
  
  return sttModels
    .sort((a, b) => {
      const aId = a.id.toLowerCase()
      const bId = b.id.toLowerCase()
      
      // 1. Turbo variants first (faster for real-time)
      const aTurbo = aId.includes('turbo') ? 1 : 0
      const bTurbo = bId.includes('turbo') ? 1 : 0
      if (bTurbo !== aTurbo) return bTurbo - aTurbo
      
      // 2. Higher version numbers
      const aVersion = extractVersionNumber(aId)
      const bVersion = extractVersionNumber(bId)
      if (bVersion !== aVersion) return bVersion - aVersion
      
      // 3. More recent created timestamp
      return b.created - a.created
    })
    .map(m => m.id)
}

function rankTTSModels(models: GroqModel[]): string[] {
  const ttsModels = models.filter(isTTSModel)
  
  return ttsModels
    .sort((a, b) => {
      const aId = a.id.toLowerCase()
      const bId = b.id.toLowerCase()
      
      // 1. English variants first (exclude arabic)
      const aArabic = aId.includes('arabic') ? 1 : 0
      const bArabic = bId.includes('arabic') ? 1 : 0
      if (aArabic !== bArabic) return aArabic - bArabic
      
      // 2. Orpheus preferred (newer technology)
      const aOrpheus = aId.includes('orpheus') ? 1 : 0
      const bOrpheus = bId.includes('orpheus') ? 1 : 0
      if (bOrpheus !== aOrpheus) return bOrpheus - aOrpheus
      
      // 3. More recent created timestamp
      return b.created - a.created
    })
    .map(m => m.id)
}

function rankChatModels(models: GroqModel[]): string[] {
  const chatModels = models.filter(isChatModel)
  
  return chatModels
    .sort((a, b) => {
      const aId = a.id.toLowerCase()
      const bId = b.id.toLowerCase()
      
      // 1. Larger parameter count
      const aParams = extractParameterCount(aId)
      const bParams = extractParameterCount(bId)
      if (bParams !== aParams) return bParams - aParams
      
      // 2. "versatile" or "instruct" variants preferred
      const aVersatile = (aId.includes('versatile') || aId.includes('instruct')) ? 1 : 0
      const bVersatile = (bId.includes('versatile') || bId.includes('instruct')) ? 1 : 0
      if (bVersatile !== aVersatile) return bVersatile - aVersatile
      
      // 3. Larger context window
      if (b.context_window !== a.context_window) {
        return b.context_window - a.context_window
      }
      
      // 4. More recent created timestamp
      return b.created - a.created
    })
    .map(m => m.id)
}

// ============================================
// FETCH AND CACHE
// ============================================

async function fetchModelsFromGroq(): Promise<GroqModel[]> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  const response = await groq.models.list()
  
  return response.data
    .filter(m => m.active)
    .map(m => ({
      id: m.id,
      object: m.object,
      created: m.created,
      owned_by: m.owned_by,
      active: m.active,
      context_window: m.context_window,
      max_completion_tokens: m.max_completion_tokens,
    })) as GroqModel[]
}

export async function refreshModelCache(): Promise<ModelRankings> {
  console.log('Refreshing model cache from Groq...')
  
  const models = await fetchModelsFromGroq()
  
  const sttModels = rankSTTModels(models)
  const ttsModels = rankTTSModels(models)
  const chatModels = rankChatModels(models)
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS)
  
  // Upsert to database (single row with id="singleton")
  await prisma.modelCache.upsert({
    where: { id: 'singleton' },
    update: {
      sttModels: sttModels,
      ttsModels: ttsModels,
      chatModels: chatModels,
      rawModels: models,
      lastUpdated: now,
      expiresAt: expiresAt,
    },
    create: {
      id: 'singleton',
      sttModels: sttModels,
      ttsModels: ttsModels,
      chatModels: chatModels,
      rawModels: models,
      lastUpdated: now,
      expiresAt: expiresAt,
    },
  })
  
  console.log('Model cache refreshed:', {
    stt: sttModels,
    tts: ttsModels,
    chat: chatModels.slice(0, 5), // Log first 5 only
  })
  
  return {
    stt: sttModels,
    tts: ttsModels,
    chat: chatModels,
    raw: models,
    updatedAt: now,
    expiresAt: expiresAt,
  }
}

export async function getModelRankings(): Promise<ModelRankings> {
  // Try to get from cache
  const cached = await prisma.modelCache.findUnique({
    where: { id: 'singleton' },
  })
  
  // If cache exists and not expired, use it
  if (cached && new Date() < new Date(cached.expiresAt)) {
    return {
      stt: cached.sttModels as string[],
      tts: cached.ttsModels as string[],
      chat: cached.chatModels as string[],
      raw: cached.rawModels as GroqModel[],
      updatedAt: cached.lastUpdated,
      expiresAt: cached.expiresAt,
    }
  }
  
  // Cache missing or expired, refresh
  return await refreshModelCache()
}

export async function getBestModel(category: ModelCategory): Promise<string | null> {
  const rankings = await getModelRankings()
  
  switch (category) {
    case 'stt':
      return rankings.stt[0] || null
    case 'tts':
      return rankings.tts[0] || null
    case 'chat':
      return rankings.chat[0] || null
    default:
      return null
  }
}

export async function getModelFallbacks(category: ModelCategory): Promise<string[]> {
  const rankings = await getModelRankings()
  
  switch (category) {
    case 'stt':
      return rankings.stt
    case 'tts':
      return rankings.tts
    case 'chat':
      return rankings.chat
    default:
      return []
  }
}

// ============================================
// MANUAL REFRESH ENDPOINT HELPER
// ============================================

export async function forceRefreshCache(): Promise<ModelRankings> {
  return await refreshModelCache()
}