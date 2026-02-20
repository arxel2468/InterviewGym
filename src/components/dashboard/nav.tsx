'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@prisma/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Home, Plus, BarChart3, Settings, LogOut, CreditCard } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/session/new', label: 'New Session', icon: Plus },
  { href: '/dashboard/history', label: 'History', icon: BarChart3 },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
]

interface DashboardNavProps {
  user: User
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">
              Interview<span className="text-gradient">Gym</span>
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl || ''} alt={user.name || 'User'} />
                  <AvatarFallback className="bg-violet-600 text-white text-sm">
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <form action="/logout" method="POST">
                <DropdownMenuItem asChild>
                  <button type="submit" className="flex items-center gap-2 w-full text-left text-red-400 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
