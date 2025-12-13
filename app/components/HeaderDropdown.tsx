'use client';

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { textMuted, dropdownItem, dropdownItemDanger, dropdownMenu, borderBottom } from '@/lib/styles/shared-styles'

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
      className={dropdownMenu}
      role="menu"
      aria-label="User menu"
    >
      <div className={`px-4 py-2 ${borderBottom}`}>
        <p className="text-sm font-semibold dark:text-slate-100">{userProfile.name}</p>
        <p className={`text-xs ${textMuted}`}>{userProfile.email}</p>
      </div>
      
      {userProfile.role === 'supervisor' && (
        <Link
          href="/authenticated/supervisor/profile"
          onClick={onClose}
          className={dropdownItem}
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
          className={dropdownItem}
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
        className={dropdownItemDanger}
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
