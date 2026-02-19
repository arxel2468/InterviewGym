// src/app/(dashboard)/dashboard/settings/page.tsx
import { requireAuth } from '@/lib/auth'
import { SettingsForm } from '@/components/settings/settings-form'

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
      </div>
      <SettingsForm user={user} />
    </div>
  )
}
