'use client';

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'

interface HeaderDropdownProps {
  userProfile: {
    name: string
    email: string
    role?: 'student' | 'supervisor' | 'admin'
  }
  onClose: () => void
}

export default function HeaderDropdown({ userProfile, onClose }: HeaderDropdownProps) {
  const router = useRouter()
  
  const handleLogout = async () => {
    await signOut()
    onClose()
    // Redirect to homepage after logout
    router.push('/')
  }

  return (
    <div 
      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-800 z-50 dark:bg-slate-800 dark:text-slate-200"
      role="menu"
      aria-label="User menu"
    >
      <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <p className="text-sm font-semibold dark:text-slate-100">{userProfile.name}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">{userProfile.email}</p>
      </div>
      
      {userProfile.role === 'supervisor' && (
        <Link
          href="/authenticated/supervisor/profile"
          onClick={onClose}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex gap-2 border-none bg-transparent cursor-pointer dark:hover:bg-slate-700"
          role="menuitem"
          aria-label="View profile"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          View Profile
        </Link>
      )}

      {userProfile.role === 'student' && (
        <Link
          href="/authenticated/student/profile"
          onClick={onClose}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex gap-2 border-none bg-transparent cursor-pointer dark:hover:bg-slate-700"
          role="menuitem"
          aria-label="View profile"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          View Profile
        </Link>
      )}

      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex gap-2 text-red-600 border-none bg-transparent cursor-pointer dark:hover:bg-slate-700 dark:text-red-400"
        role="menuitem"
        aria-label="Logout"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  )
}
