import { requireAuth } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'
import { AuthProvider } from '@/components/providers/auth-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#09090B]">
        <DashboardNav user={user} />
        <main className="container mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
