'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ClipboardPaste,
} from 'lucide-react'

type ParsedResume = {
  name?: string
  skills: string[]
  experience: { title: string; company: string }[]
  projects: { name: string }[]
}

interface ResumeUploadProps {
  currentResume?: {
    fileName: string
    parsedData: ParsedResume | null
  } | null
}

export function ResumeUpload({ currentResume }: ResumeUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Resume analyzed successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process resume')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePasteSubmit = async () => {
    if (pasteText.length < 50) {
      toast.error('Please paste more resume content')
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Parse failed')
      }

      toast.success('Resume analyzed successfully')
      setShowPaste(false)
      setPasteText('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse resume')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch('/api/resume', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast.success('Resume removed')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete resume')
    } finally {
      setIsDeleting(false)
    }
  }

  const parsed = currentResume?.parsedData as ParsedResume | null

  if (currentResume) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-white">
                  {currentResume.fileName}
                </p>
                <p className="text-xs text-zinc-500">
                  Ready for personalized questions
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {parsed && (
            <div className="space-y-3 text-sm">
              {parsed.skills.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-zinc-400">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {parsed.skills.slice(0, 8).map((skill, i) => (
                      <span
                        key={i}
                        className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsed.skills.length > 8 && (
                      <span className="px-2 py-0.5 text-xs text-zinc-500">
                        +{parsed.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {parsed.experience.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-zinc-400">Experience</p>
                  {parsed.experience.slice(0, 2).map((exp, i) => (
                    <p key={i} className="text-xs text-zinc-300">
                      {exp.title} at {exp.company}
                    </p>
                  ))}
                </div>
              )}

              {parsed.projects.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-zinc-400">Projects</p>
                  <p className="text-xs text-zinc-300">
                    {parsed.projects
                      .map((p) => p.name)
                      .slice(0, 3)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <FileText className="h-5 w-5" />
          Resume (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPaste ? (
          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="h-40 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handlePasteSubmit}
                disabled={isUploading || pasteText.length < 50}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Resume'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaste(false)
                  setPasteText('')
                }}
                className="border-zinc-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border-2 border-dashed border-zinc-700 p-6 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-500" />
              <p className="mb-1 text-sm text-zinc-300">Add your resume</p>
              <p className="mb-4 text-xs text-zinc-500">
                Paste text works best • Supports DOCX and TXT files
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowPaste(true)}
                  disabled={isUploading}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <ClipboardPaste className="mr-2 h-4 w-4" />
                  Paste Resume Text
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  variant="outline"
                  className="border-zinc-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />
              <p className="text-xs text-violet-300">
                Your resume is analyzed instantly and never stored. Only
                extracted skills and experience are saved.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
