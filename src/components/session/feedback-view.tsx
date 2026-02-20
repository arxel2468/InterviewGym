'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  ArrowLeft,
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
  User,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { getFillerAssessment, getLengthAssessment, getTimeAssessment } from '@/lib/utils/metrics'

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
    totalFillerWords?: number | null
    totalPauses?: number | null
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
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-zinc-800"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={`${percentage * 2.83} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg sm:text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-400 mt-2">{label}</span>
    </div>
  )
}

function MetricItem({
  label,
  value,
  assessment
}: {
  label: string
  value: string | number
  assessment?: string
}) {
  return (
    <div className="p-3 rounded-lg bg-zinc-800/50">
      <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
      {assessment && (
        <p className="text-xs text-zinc-500 mt-1">{assessment}</p>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#8b5cf6'
  if (score >= 4) return '#f59e0b'
  return '#ef4444'
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

  const avgWordsPerResponse = metrics
    ? Math.round(metrics.totalWordCount / Math.max(metrics.questionsAnswered, 1))
    : 0

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
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-zinc-800"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke={getScoreColor(overallScore)}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(overallScore / 10) * 283} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-white">{overallScore}</span>
                  <span className="text-xs text-zinc-400">out of 10</span>
                </div>
              </div>
              <span className="text-sm text-zinc-400 mt-2">Overall Score</span>
            </div>

            {/* Sub Scores */}
            <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
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

      {/* Speaking Analysis */}
      {metrics && (
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
                assessment={getFillerAssessment(metrics.totalFillerWords ?? 0, metrics.totalWordCount)}
              />
              <MetricItem
                label="Words/Response"
                value={avgWordsPerResponse}
                assessment={getLengthAssessment(avgWordsPerResponse)}
              />
              <MetricItem
                label="Avg Response"
                value={`${Math.round((metrics.averageResponseMs || 0) / 1000)}s`}
                assessment={getTimeAssessment(metrics.averageResponseMs || 0)}
              />
              <MetricItem
                label="Total Words"
                value={metrics.totalWordCount}
              />
            </div>
          </CardContent>
        </Card>
      )}


      {/* TODO: English Fluency Card — only for paid users or always? */}


      {/* Summary */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-300 leading-relaxed">{feedback.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.length > 0 ? strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-zinc-300 text-sm">{strength}</span>
                </li>
              )) : (
                <p className="text-zinc-500 text-sm">No specific strengths identified</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.length > 0 ? improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <span className="text-zinc-300 text-sm">{improvement}</span>
                </li>
              )) : (
                <p className="text-zinc-500 text-sm">No specific improvements identified</p>
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
            {suggestions.length > 0 ? suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
                <span className="text-violet-400 font-bold">{index + 1}.</span>
                <span className="text-zinc-300 text-sm">{suggestion}</span>
              </li>
            )) : (
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
              {messages.map((message) => (
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
                    {message.role === 'candidate' && (
                        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                          {message.wordCount && (
                            <span>{message.wordCount} words</span>
                          )}
                          {message.fillerWordCount != null && message.fillerWordCount > 0 && (
                            <span className="text-amber-400">
                              {message.fillerWordCount} filler{message.fillerWordCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {message.wordCount && message.wordCount < 30 && (
                            <span className="text-red-400">Too brief</span>
                          )}
                          {message.wordCount && message.wordCount > 200 && (
                            <span className="text-amber-400">Could be more concise</span>
                          )}
                        </div>
                      )}
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
