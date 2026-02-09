// src/lib/ai-optimization.ts

import { logger } from './logger'

/**
 * Token estimation for cost tracking
 * Rough estimate: 1 token ≈ 4 characters for English
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Truncate text to stay within token limits
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  suffix: string = '...[truncated]'
): string {
  const maxChars = maxTokens * 4
  
  if (text.length <= maxChars) {
    return text
  }
  
  return text.slice(0, maxChars - suffix.length) + suffix
}

/**
 * Compress conversation history to reduce token usage
 * Keeps first message (intro) and last N exchanges
 */
export function compressConversationHistory<T extends { role: string; content: string }>(
  messages: T[],
  maxMessages: number = 10
): T[] {
  if (messages.length <= maxMessages) {
    return messages
  }
  
  // Keep first message (interviewer intro)
  const first = messages[0]
  
  // Keep last N-1 messages
  const recent = messages.slice(-(maxMessages - 1))
  
  logger.debug('Compressed conversation history', {
    original: messages.length,
    compressed: maxMessages,
  })
  
  return [first, ...recent]
}

/**
 * Check if we should use a smaller/faster model based on request type
 */
export type ModelTier = 'fast' | 'balanced' | 'quality'

export function selectModelTier(context: {
  isFirstMessage: boolean
  isClosingMessage: boolean
  conversationLength: number
}): ModelTier {
  // First message needs quality (sets the tone)
  if (context.isFirstMessage) {
    return 'quality'
  }
  
  // Closing messages can use faster model
  if (context.isClosingMessage) {
    return 'fast'
  }
  
  // Long conversations - use balanced to save costs
  if (context.conversationLength > 8) {
    return 'balanced'
  }
  
  return 'quality'
}

/**
 * Response cache for common patterns
 * Reduces redundant AI calls
 */
const responsePatterns = new Map<string, { response: string; timestamp: number }>()
const PATTERN_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export function getCachedPattern(key: string): string | null {
  const cached = responsePatterns.get(key)
  
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > PATTERN_CACHE_TTL) {
    responsePatterns.delete(key)
    return null
  }
  
  return cached.response
}

export function setCachedPattern(key: string, response: string): void {
  // Limit cache size
  if (responsePatterns.size > 100) {
    const oldest = responsePatterns.keys().next().value
    if (oldest) responsePatterns.delete(oldest)
  }
  
  responsePatterns.set(key, { response, timestamp: Date.now() })
}

/**
 * Generate cache key for similar requests
 */
export function generatePatternKey(
  interviewType: string,
  difficulty: string,
  questionCategory: string,
  isFollowUp: boolean
): string {
  return `${interviewType}:${difficulty}:${questionCategory}:${isFollowUp ? 'followup' : 'main'}`
}

/**
 * Track AI usage for monitoring
 */
type UsageRecord = {
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  timestamp: Date
}

const usageLog: UsageRecord[] = []
const MAX_USAGE_LOG = 1000

export function trackAIUsage(record: UsageRecord): void {
  usageLog.push(record)
  
  // Rotate log
  if (usageLog.length > MAX_USAGE_LOG) {
    usageLog.shift()
  }
  
  logger.info('AI usage', {
    model: record.model,
    tokens: record.inputTokens + record.outputTokens,
    latencyMs: record.latencyMs,
  })
}

export function getUsageStats(): {
  totalRequests: number
  totalTokens: number
  avgLatencyMs: number
  byModel: Record<string, number>
} {
  const byModel: Record<string, number> = {}
  let totalTokens = 0
  let totalLatency = 0
  
  for (const record of usageLog) {
    totalTokens += record.inputTokens + record.outputTokens
    totalLatency += record.latencyMs
    byModel[record.model] = (byModel[record.model] || 0) + 1
  }
  
  return {
    totalRequests: usageLog.length,
    totalTokens,
    avgLatencyMs: usageLog.length > 0 ? Math.round(totalLatency / usageLog.length) : 0,
    byModel,
  }
}
