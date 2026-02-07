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
  ClipboardPaste
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
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white text-sm font-medium">{currentResume.fileName}</p>
                <p className="text-xs text-zinc-500">Ready for personalized questions</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>

          {parsed && (
            <div className="space-y-3 text-sm">
              {parsed.skills.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-xs mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {parsed.skills.slice(0, 8).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs">
                        {skill}
                      </span>
                    ))}
                    {parsed.skills.length > 8 && (
                      <span className="px-2 py-0.5 text-zinc-500 text-xs">
                        +{parsed.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {parsed.experience.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-xs mb-1">Experience</p>
                  {parsed.experience.slice(0, 2).map((exp, i) => (
                    <p key={i} className="text-zinc-300 text-xs">
                      {exp.title} at {exp.company}
                    </p>
                  ))}
                </div>
              )}

              {parsed.projects.length > 0 && (
                <div>
                  <p className="text-zinc-400 text-xs mb-1">Projects</p>
                  <p className="text-zinc-300 text-xs">
                    {parsed.projects.map(p => p.name).slice(0, 3).join(', ')}
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
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
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
              className="w-full h-40 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handlePasteSubmit}
                disabled={isUploading || pasteText.length < 50}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Resume'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowPaste(false); setPasteText('') }}
                className="border-zinc-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>

          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
            <p className="text-zinc-300 text-sm mb-1">Add your resume</p>
            <p className="text-zinc-500 text-xs mb-4">Paste text works best • Supports DOCX and TXT files</p>

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
                <ClipboardPaste className="w-4 h-4 mr-2" />
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <AlertCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300">
                Your resume is analyzed instantly and never stored. Only extracted skills and experience are saved.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
