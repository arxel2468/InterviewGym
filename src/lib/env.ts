// src/lib/env.ts

import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  
  // Groq
  GROQ_API_KEY: z.string().min(1),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables at build/startup time
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.format())
    throw new Error('Invalid environment variables')
  }
  
  return result.data
}

/**
 * Get validated environment variable
 * Use this instead of process.env directly
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const value = process.env[key]
  
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  
  return value as Env[K]
}
