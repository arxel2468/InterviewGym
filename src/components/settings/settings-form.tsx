// src/components/settings/settings-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Loader2, 
  User as UserIcon, 
  Briefcase, 
  Trash2,
  AlertTriangle,
  Save,
  CreditCard
} from 'lucide-react'

interface SettingsFormProps {
  user: User
  subscription?: {
    plan: string
    status: string
    currentPeriodEnd: Date
  } | null
}


const ROLES = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Full Stack Developer' },
  { value: 'data', label: 'Data Engineer / Scientist' },
  { value: 'devops', label: 'DevOps / SRE' },
  { value: 'mobile', label: 'Mobile Developer' },
  { value: 'product', label: 'Product Manager' },
  { value: 'general', label: 'Other / General' },
]

const TIMELINES = [
  { value: 'this_week', label: 'This week' },
  { value: '2_4_weeks', label: '2-4 weeks' },
  { value: 'exploring', label: 'Just exploring' },
]


const [isCancelling, setIsCancelling] = useState(false)

const handleCancelSubscription = async () => {
  if (!confirm('Are you sure? You will lose access to premium features at the end of your billing period.')) {
    return
  }

  setIsCancelling(true)
  try {
    const response = await fetch('/api/payment/cancel', {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to cancel')

    toast.success('Subscription cancelled. Access continues until end of billing period.')
    router.refresh()
  } catch {
    toast.error('Failed to cancel subscription')
  } finally {
    setIsCancelling(false)
  }
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const [targetRole, setTargetRole] = useState(user.targetRole || 'fullstack')
  const [timeline, setTimeline] = useState(user.interviewTimeline || 'exploring')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, interviewTimeline: timeline }),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      toast.success('Settings saved')
      router.refresh()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      toast.success('Account deleted')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Name</label>
            <p className="text-white">{user.name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <p className="text-white">{user.email}</p>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Member since</label>
            <p className="text-white">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interview Preferences */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Interview Preferences
          </CardTitle>
          <CardDescription>
            These settings affect your interview questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Role */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              Target Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setTargetRole(role.value)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    targetRole === role.value
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              Interview Timeline
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIMELINES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeline(t.value)}
                  className={`p-3 rounded-lg border text-center text-sm transition-all ${
                    timeline === t.value
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{user.totalSessions}</p>
              <p className="text-xs text-zinc-500">Total Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{user.currentStreak}</p>
              <p className="text-xs text-zinc-500">Current Streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{user.longestStreak}</p>
              <p className="text-xs text-zinc-500">Best Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      {subscription && subscription.status === 'active' && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium capitalize">{subscription.plan} Plan</p>
                <p className="text-sm text-zinc-400">
                  Renews on{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                Active
              </span>
            </div>
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="border-zinc-700 text-zinc-400 hover:text-red-400"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="bg-zinc-900/50 border-red-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Delete Account</p>
                <p className="text-sm text-zinc-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-900 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-400">
                Are you sure? This action cannot be undone. All your sessions, 
                feedback, and progress will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Yes, Delete My Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
