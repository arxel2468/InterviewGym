// src/app/api/user/plan/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ plan: 'free', features: [] })
    }

    const plan = await getUserPlan(user.id)
    return NextResponse.json(plan)
  } catch {
    return NextResponse.json({ plan: 'free', features: [] })
  }
}
