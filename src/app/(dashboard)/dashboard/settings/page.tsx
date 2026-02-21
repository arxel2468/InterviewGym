// src/app/(dashboard)/dashboard/settings/page.tsx

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from '@/components/settings/settings-form'

export default async function SettingsPage() {
  const user = await requireAuth()

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-zinc-400">
          Manage your account and preferences
        </p>
      </div>
      <SettingsForm
        user={user}
        subscription={
          subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
              }
            : null
        }
      />
    </div>
  )
}
