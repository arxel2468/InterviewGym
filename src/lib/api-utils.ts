// src/lib/api-utils.ts

import { NextResponse } from 'next/server'

/**
 * Standard API error response
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...details,
    },
    { status }
  )
}

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  )
}

/**
 * Validate request content type
 */
export function validateContentType(
  request: Request,
  expected: string = 'application/json'
): boolean {
  const contentType = request.headers.get('content-type')
  return contentType?.includes(expected) ?? false
}

/**
 * Simple in-memory rate limiter for API routes
 * For production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkApiRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now,
  }
}
