import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/reacct'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'InterviewGym - Practice Interviews with AI',
    template: '%s | InterviewGym',
  },
  description: 'Practice interviews with an AI that asks real questions, gives honest feedback, and helps you build confidence. Fail safely before you fail expensively.',
  keywords: ['interview practice', 'mock interview', 'AI interview', 'behavioral interview', 'job interview prep'],
  authors: [{ name: 'InterviewGym' }],
  openGraph: {
    title: 'InterviewGym - Practice Interviews with AI',
    description: 'Practice interviews with an AI that asks real questions and gives honest feedback.',
    url: 'https://interviewgym.vercel.app',
    siteName: 'InterviewGym',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InterviewGym - Practice Interviews with AI',
    description: 'Practice interviews with an AI that asks real questions and gives honest feedback.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}