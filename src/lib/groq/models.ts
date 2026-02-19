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
  const match = modelId.toLowerCase().match(/(\d+)b/)
  return match ? parseInt(match[1], 10) : 0
}

function extractVersionNumber(modelId: string): number {
  const match = modelId.toLowerCase().match(/v(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function rankSTTModels(models: GroqModel[]): string[] {
  const sttModels = models.filter(isSTTModel)
  
  return sttModels
    .sort((a, b) => {
      const aId = a.id.toLowerCase()
      const bId = b.id.toLowerCase()
      
      const aTurbo = aId.includes('turbo') ? 1 : 0
      const bTurbo = bId.includes('turbo') ? 1 : 0
      if (bTurbo !== aTurbo) return bTurbo - aTurbo
      
      const aVersion = extractVersionNumber(aId)
      const bVersion = extractVersionNumber(bId)
      if (bVersion !== aVersion) return bVersion - aVersion
      
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
      
      const aArabic = aId.includes('arabic') ? 1 : 0
      const bArabic = bId.includes('arabic') ? 1 : 0
      if (aArabic !== bArabic) return aArabic - bArabic
      
      const aOrpheus = aId.includes('orpheus') ? 1 : 0
      const bOrpheus = bId.includes('orpheus') ? 1 : 0
      if (bOrpheus !== aOrpheus) return bOrpheus - aOrpheus
      
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
      
      const aParams = extractParameterCount(aId)
      const bParams = extractParameterCount(bId)
      if (bParams !== aParams) return bParams - aParams
      
      const aVersatile = (aId.includes('versatile') || aId.includes('instruct')) ? 1 : 0
      const bVersatile = (bId.includes('versatile') || bId.includes('instruct')) ? 1 : 0
      if (bVersatile !== aVersatile) return bVersatile - aVersatile
      
      if (b.context_window !== a.context_window) {
        return b.context_window - a.context_window
      }
      
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
  
  // Cast to any because Groq SDK types don't include all fields returned by API
  const models = response.data as any[]
  
  return models
    .filter(m => m.active !== false)
    .map(m => ({
      id: m.id,
      object: m.object,
      created: m.created,
      owned_by: m.owned_by,
      active: m.active ?? true,
      context_window: m.context_window ?? 0,
      max_completion_tokens: m.max_completion_tokens ?? 0,
    }))
}

export async function refreshModelCache(): Promise<ModelRankings> {
  logger.info('Refreshing model cache from Groq...')
  
  const models = await fetchModelsFromGroq()
  
  const sttModels = rankSTTModels(models)
  const ttsModels = rankTTSModels(models)
  const chatModels = rankChatModels(models)
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS)
  
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
  
  logger.info('Model cache refreshed:', {
    stt: sttModels,
    tts: ttsModels,
    chat: chatModels.slice(0, 5),
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
  const cached = await prisma.modelCache.findUnique({
    where: { id: 'singleton' },
  })
  
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

export async function forceRefreshCache(): Promise<ModelRankings> {
  return await refreshModelCache()
}
