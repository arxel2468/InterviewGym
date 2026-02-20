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
      <nav className="border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-white">
              Interview<span className="text-gradient">Gym</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing">
                <Button variant="ghost" className="text-zinc-400 hover:text-white">
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
                    <Button variant="ghost" className="text-zinc-400 hover:text-white">
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
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 max-w-6xl pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-8">
              <Zap className="w-4 h-4" />
              AI-Powered Interview Practice
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Fail your interviews{' '}
              <span className="text-gradient">safely</span>
              <br />
              before you fail them{' '}
              <span className="text-gradient">expensively</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Practice with an AI interviewer that asks real questions, gives honest feedback, 
              and helps you build the confidence to ace your next interview.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 h-12 px-8 text-lg">
                  Start Practicing Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-zinc-500">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              You know the material.<br />
              <span className="text-zinc-400">But interviews are different.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              The gap between knowing something and articulating it under pressure is where most candidates fail.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
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
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Practice like it's real.<br />
              <span className="text-gradient">Because it feels real.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              InterviewGym is the only voice-based interview simulator that creates genuine pressure 
              — with follow-up questions, uncomfortable silences, and brutally honest feedback.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
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
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready in 30 seconds
            </h2>
            <p className="text-zinc-400 text-lg">
              No complicated setup. Just sign in and start practicing.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
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
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">AI Interviewer</p>
                    <p className="text-xs text-zinc-500">Standard difficulty</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-zinc-300 text-sm">
                      "Tell me about a time when you had to deal with a difficult stakeholder. 
                      How did you handle the situation?"
                    </p>
                  </div>
                  <div className="bg-violet-500/10 rounded-lg p-3 ml-8">
                    <p className="text-zinc-300 text-sm">
                      "In my last project, we had a product manager who kept changing requirements..."
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-zinc-300 text-sm">
                      "Interesting. What specifically did you do when they changed the requirements 
                      mid-sprint? Walk me through your exact actions."
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-violet-600/10 rounded-xl blur-xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="relative bg-gradient-to-b from-violet-600/20 to-transparent rounded-2xl border border-violet-500/20 p-12 text-center overflow-hidden">
            {/* Background effect */}
            <div className="absolute inset-0 bg-grid opacity-30" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Your next interview is coming.
              </h2>
              <p className="text-xl text-zinc-300 mb-8">
                Will you be ready?
              </p>
              <Link href="/login">
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 h-12 px-8 text-lg">
                  Start Practicing Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-zinc-500 mt-4">
                Free to use. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">
                Interview<span className="text-gradient">Gym</span>
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-500 text-sm">
                Train until you can't fail
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <span className="text-zinc-500 text-sm">
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
function ProblemCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  )
}

// Component: Feature Card
function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType
  title: string
  description: string 
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  )
}

// Component: Step Card
function StepCard({ 
  number, 
  title, 
  description 
}: { 
  number: string
  title: string
  description: string 
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
        <span className="text-white font-bold text-lg">{number}</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  )
}

// Component: Benefit Item
function BenefitItem({ 
  icon: Icon, 
  text 
}: { 
  icon: React.ElementType
  text: string 
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-green-500" />
      </div>
      <span className="text-zinc-300">{text}</span>
    </li>
  )
}
