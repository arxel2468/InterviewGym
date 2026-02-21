import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SessionSetupForm } from '@/components/session/setup-form'
import { ResumeUpload } from '@/components/resume/resume-upload'

export default async function NewSessionPage() {
  const user = await requireAuth()

  const resume = await prisma.resume.findUnique({
    where: { userId: user.id },
    select: {
      fileName: true,
      parsedData: true,
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Start a Practice Session
        </h1>
        <p className="mt-1 text-zinc-400">
          Configure your interview and begin when ready
        </p>
      </div>

      <SessionSetupForm
        targetRole={user.targetRole || undefined}
        hasResume={!!resume}
      />

      <ResumeUpload
        currentResume={
          resume
            ? {
                fileName: resume.fileName,
                parsedData: resume.parsedData as any,
              }
            : null
        }
      />
    </div>
  )
}
