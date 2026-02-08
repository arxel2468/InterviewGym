// src/lib/validation.ts

import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  nonEmptyString: z.string().min(1),
}
