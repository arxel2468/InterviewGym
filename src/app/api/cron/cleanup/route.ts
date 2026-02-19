// src/app/api/cron/cleanup/route.ts
// Vercel Cron or called less frequently
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const result = await prisma.session.updateMany({
    where: {
      status: 'in_progress',
      startedAt: { lt: cutoff },
    },
    data: { status: 'abandoned' },
  })

  return NextResponse.json({ cleaned: result.count })
}
