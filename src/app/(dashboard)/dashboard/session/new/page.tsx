import { requireAuth } from '@/lib/auth'
import { SessionSetupForm } from '@/components/session/setup-form'

export default async function NewSessionPage() {
  const user = await requireAuth()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Start a Practice Session</h1>
        <p className="text-zinc-400 mt-1">
          Configure your interview and begin when ready
        </p>
      </div>

      <SessionSetupForm 
        targetRole={user.targetRole || undefined}
        hasResume={!!user.resume}
      />
    </div>
  )
}