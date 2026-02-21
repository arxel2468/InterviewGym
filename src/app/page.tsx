// src/app/page.tsx — REPLACE the navigation section at the top

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import {
  Mic,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Target,
  TrendingUp,
  Github,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-white">
              Interview<span className="text-gradient">Gym</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing">
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-white"
                >
                  Pricing
                </Button>
              </Link>
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-primary hover:opacity-90">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-gradient-primary hover:opacity-90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="container relative mx-auto max-w-6xl px-4 pb-20 pt-24">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-400">
              <Zap className="h-4 w-4" />
              AI-Powered Interview Practice
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Fail your interviews <span className="text-gradient">safely</span>
              <br />
              before you fail them{' '}
              <span className="text-gradient">expensively</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl">
              Practice with an AI interviewer that asks real questions, gives
              honest feedback, and helps you build the confidence to ace your
              next interview.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-primary h-12 px-8 text-lg hover:opacity-90"
                >
                  Start Practicing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-zinc-500">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-t border-zinc-800/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              You know the material.
              <br />
              <span className="text-zinc-400">
                But interviews are different.
              </span>
            </h2>
            <p className="text-lg text-zinc-400">
              The gap between knowing something and articulating it under
              pressure is where most candidates fail.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ProblemCard
              title="Mind goes blank"
              description="You've solved hundreds of problems, but when the interviewer asks, suddenly you can't remember anything."
            />
            <ProblemCard
              title="Rambling answers"
              description="You know what you want to say, but it comes out unstructured and you lose the interviewer halfway through."
            />
            <ProblemCard
              title="No real practice"
              description="Reading about interviews isn't the same as doing them. You need reps, but real interviews are high-stakes."
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="border-t border-zinc-800/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Practice like it's real.
              <br />
              <span className="text-gradient">Because it feels real.</span>
            </h2>
            <p className="text-lg text-zinc-400">
              InterviewGym is the only voice-based interview simulator that
              creates genuine pressure — with follow-up questions, uncomfortable
              silences, and brutally honest feedback.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={Mic}
              title="Voice-Based Practice"
              description="Speak your answers out loud, just like in a real interview. No typing, no shortcuts."
            />
            <FeatureCard
              icon={MessageSquare}
              title="AI That Pushes Back"
              description="Our interviewer asks follow-ups, challenges weak answers, and doesn't let you off easy."
            />
            <FeatureCard
              icon={BarChart3}
              title="Actionable Feedback"
              description="Get specific scores and suggestions after each session. Know exactly what to improve."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-zinc-800/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready in 30 seconds
            </h2>
            <p className="text-lg text-zinc-400">
              No complicated setup. Just sign in and start practicing.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="1"
              title="Choose your difficulty"
              description="Start with warm-up mode to build confidence, or jump straight to intense for maximum pressure."
            />
            <StepCard
              number="2"
              title="Practice out loud"
              description="The AI interviewer asks questions and you respond by speaking. Just like the real thing."
            />
            <StepCard
              number="3"
              title="Get better"
              description="Review your transcript, scores, and personalized feedback. Then do it again."
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-zinc-800/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
                Built for people who are serious about landing the job
              </h2>
              <ul className="space-y-4">
                <BenefitItem
                  icon={Clock}
                  text="Practice anytime — no scheduling, no matching with strangers"
                />
                <BenefitItem
                  icon={Target}
                  text="Unlimited sessions — build real muscle memory"
                />
                <BenefitItem
                  icon={TrendingUp}
                  text="Track your progress — see yourself getting better"
                />
                <BenefitItem
                  icon={Shield}
                  text="Fail safely — make mistakes here, not in real interviews"
                />
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
                    <MessageSquare className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">AI Interviewer</p>
                    <p className="text-xs text-zinc-500">Standard difficulty</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-zinc-800 p-3">
                    <p className="text-sm text-zinc-300">
                      "Tell me about a time when you had to deal with a
                      difficult stakeholder. How did you handle the situation?"
                    </p>
                  </div>
                  <div className="ml-8 rounded-lg bg-violet-500/10 p-3">
                    <p className="text-sm text-zinc-300">
                      "In my last project, we had a product manager who kept
                      changing requirements..."
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-800 p-3">
                    <p className="text-sm text-zinc-300">
                      "Interesting. What specifically did you do when they
                      changed the requirements mid-sprint? Walk me through your
                      exact actions."
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 -z-10 rounded-xl bg-violet-600/10 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-800/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-600/20 to-transparent p-12 text-center">
            {/* Background effect */}
            <div className="bg-grid absolute inset-0 opacity-30" />

            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Your next interview is coming.
              </h2>
              <p className="mb-8 text-xl text-zinc-300">Will you be ready?</p>
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-12 bg-white px-8 text-lg text-zinc-900 hover:bg-zinc-100"
                >
                  Start Practicing Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-4 text-sm text-zinc-500">
                Free to use. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">
                Interview<span className="text-gradient">Gym</span>
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-sm text-zinc-500">
                Train until you can't fail
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                <Github className="h-5 w-5" />
              </a>
              <span className="text-sm text-zinc-500">
                © {new Date().getFullYear()} InterviewGym
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Component: Problem Card
function ProblemCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  )
}

// Component: Feature Card
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
        <Icon className="h-6 w-6 text-violet-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  )
}

// Component: Step Card
function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="bg-gradient-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <span className="text-lg font-bold text-white">{number}</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  )
}

// Component: Benefit Item
function BenefitItem({
  icon: Icon,
  text,
}: {
  icon: React.ElementType
  text: string
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
        <Icon className="h-4 w-4 text-green-500" />
      </div>
      <span className="text-zinc-300">{text}</span>
    </li>
  )
}
