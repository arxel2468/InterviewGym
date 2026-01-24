'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { 
  ArrowLeft, 
  BarChart3,
  Plus, 
  Clock, 
  MessageSquare, 
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react'
import { useState } from 'react'

interface FeedbackViewProps {
  session: {
    id: string
    interviewType: string
    difficulty: string
    durationSeconds: number | null
    completedAt: Date | null
  }
  messages: {
    id: string
    role: string
    content: string
    orderIndex: number
    fillerWordCount?: number | null
    wordCount?: number | null
  }[]
  metrics: {
    questionsAnswered: number
    averageResponseMs: number
    totalWordCount: number
    totalFillerWords?: number
    totalPauses?: number
    clarityScore: number | null
    structureScore: number | null
    relevanceScore: number | null
    confidenceScore: number | null
    overallScore: number | null
  } | null
  feedback: {
    strengths: unknown
    improvements: unknown
    suggestions: unknown
    summary: string
  }
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const percentage = (score / 10) * 100
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-zinc-800"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={`${percentage * 2.26} 226`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-400 mt-2">{label}</span>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function MetricItem({
  label,
  value,
  description
}: {
  label: string
  value: string | number
  description: string
}) {
  return (
    <div className="p-3 rounded-lg bg-zinc-800/50">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      )}
    </div>
  )
}

function getFillerWordsAssessment(fillerCount: number, totalWords: number): string {
  if (totalWords === 0) return ''
  const ratio = fillerCount / totalWords
  if (ratio < 0.02) return '✓ Excellent'
  if (ratio < 0.05) return 'Good'
  if (ratio < 0.10) return 'Needs work'
  return 'High - practice reducing'
}

function getWordCountAssessment(totalWords: number, responses: number): string {
  if (responses === 0) return ''
  const avg = totalWords / responses
  if (avg < 30) return 'Too brief'
  if (avg < 50) return 'Could elaborate more'
  if (avg <= 150) return '✓ Good length'
  return 'Consider being more concise'
}

function getResponseTimeAssessment(avgMs: number): string {
  const seconds = avgMs / 1000
  if (seconds < 10) return 'Very quick'
  if (seconds < 30) return 'Good pace'
  if (seconds < 60) return '✓ Thoughtful'
  if (seconds < 120) return 'Taking time'
  return 'Quite long'
}

export function FeedbackView({ session, messages, metrics, feedback }: FeedbackViewProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  
  const strengths = Array.isArray(feedback.strengths) ? feedback.strengths as string[] : []
  const improvements = Array.isArray(feedback.improvements) ? feedback.improvements as string[] : []
  const suggestions = Array.isArray(feedback.suggestions) ? feedback.suggestions as string[] : []

  const overallScore = metrics?.overallScore || 5
  const clarityScore = metrics?.clarityScore || 5
  const structureScore = metrics?.structureScore || 5
  const relevanceScore = metrics?.relevanceScore || 5
  const confidenceScore = metrics?.confidenceScore || 5

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#22c55e' // green
    if (score >= 6) return '#8b5cf6' // violet
    if (score >= 4) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/dashboard" 
            className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-white">Session Complete</h1>
          <p className="text-zinc-400 capitalize">
            {session.interviewType.replace('_', ' ')} · {session.difficulty} difficulty
          </p>
        </div>
        <Link href="/dashboard/session/new">
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Overall Score */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Main Score */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-zinc-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={getScoreColor(overallScore)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(overallScore / 10) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{overallScore}</span>
                  <span className="text-xs text-zinc-400">out of 10</span>
                </div>
              </div>
              <span className="text-sm text-zinc-400 mt-2">Overall Score</span>
            </div>

            {/* Sub Scores */}
            <div className="flex gap-6 flex-wrap justify-center md:justify-start">
              <ScoreRing score={clarityScore} label="Clarity" color={getScoreColor(clarityScore)} />
              <ScoreRing score={structureScore} label="Structure" color={getScoreColor(structureScore)} />
              <ScoreRing score={relevanceScore} label="Relevance" color={getScoreColor(relevanceScore)} />
              <ScoreRing score={confidenceScore} label="Confidence" color={getScoreColor(confidenceScore)} />
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Clock className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {session.durationSeconds ? formatDuration(session.durationSeconds) : '--:--'}
                  </p>
                  <p className="text-xs text-zinc-500">Duration</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{metrics?.questionsAnswered || 0}</p>
                  <p className="text-xs text-zinc-500">Responses</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Target className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{metrics?.totalWordCount || 0}</p>
                  <p className="text-xs text-zinc-500">Words</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {metrics?.averageResponseMs 
                      ? `${Math.round(metrics.averageResponseMs / 1000)}s`
                      : '--'}
                  </p>
                  <p className="text-xs text-zinc-500">Avg Response</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-300 leading-relaxed">{feedback.summary}</p>
        </CardContent>
      </Card>

      {/* Speaking Metrics */}
      {metrics && (metrics.totalFillerWords !== undefined || metrics.totalPauses !== undefined) && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              Speaking Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="Filler Words"
                value={metrics.totalFillerWords ?? 0}
                description={getFillerWordsAssessment(metrics.totalFillerWords ?? 0, metrics.totalWordCount)}
              />
              <MetricItem
                label="Words per Response"
                value={Math.round(metrics.totalWordCount / Math.max(metrics.questionsAnswered, 1))}
                description={getWordCountAssessment(metrics.totalWordCount, metrics.questionsAnswered)}
              />
              <MetricItem
                label="Avg Response Time"
                value={`${Math.round((metrics.averageResponseMs || 0) / 1000)}s`}
                description={getResponseTimeAssessment(metrics.averageResponseMs || 0)}
              />
              <MetricItem
                label="Total Words"
                value={metrics.totalWordCount}
                description=""
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-zinc-300 text-sm">{strength}</span>
                </li>
              ))}
              {strengths.length === 0 && (
                <p className="text-zinc-500 text-sm">No strengths identified</p>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Areas to Improve */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span className="text-zinc-300 text-sm">{improvement}</span>
                </li>
              ))}
              {improvements.length === 0 && (
                <p className="text-zinc-500 text-sm">No improvements identified</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            Suggestions for Next Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
                <span className="text-violet-400 font-bold">{index + 1}.</span>
                <span className="text-zinc-300 text-sm">{suggestion}</span>
              </li>
            ))}
            {suggestions.length === 0 && (
              <p className="text-zinc-500 text-sm">No specific suggestions</p>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-zinc-400" />
              Full Transcript
            </CardTitle>
            {showTranscript ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </CardHeader>
        {showTranscript && (
          <CardContent>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'candidate' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${message.role === 'interviewer' 
                      ? 'bg-violet-500/20 text-violet-400' 
                      : 'bg-blue-500/20 text-blue-400'}
                  `}>
                    {message.role === 'interviewer' 
                      ? <MessageSquare className="w-4 h-4" />
                      : <User className="w-4 h-4" />
                    }
                  </div>
                  <div className={`
                    max-w-[80%] p-3 rounded-lg
                    ${message.role === 'interviewer'
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-violet-500/10 text-zinc-300'}
                  `}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Link href="/dashboard">
          <Button variant="outline" className="border-zinc-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/dashboard/session/new">
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
        </Link>
      </div>
    </div>
  )
}
