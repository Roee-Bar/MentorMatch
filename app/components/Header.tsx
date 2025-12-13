'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile, signOut } from '@/lib/auth'
import { User } from 'firebase/auth'
import HeaderDropdown from './HeaderDropdown'
import MentorMatchLogo from './shared/MentorMatchLogo'
import { textMuted, mobileNavItem, avatarSm, avatarMd, avatarPlaceholderSm, avatarPlaceholderMd, touchTargetBtnLight, headingLg, borderBottom, borderTop, logoutBtnFull } from '@/lib/styles/shared-styles'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        const token = await user.getIdToken()
        const profile = await getUserProfile(user.uid, token)
        if (profile.success) {
          setUserProfile(profile.data)
        }
      } else {
        setUserProfile(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    await signOut()
    setMobileMenuOpen(false)
    router.push('/')
  }

  const getProfileLink = () => {
    if (userProfile?.role === 'supervisor') {
      return '/authenticated/supervisor/profile'
    }
    if (userProfile?.role === 'student') {
      return '/authenticated/student/profile'
    }
    return '/'
  }

  const getDashboardLink = () => {
    if (userProfile?.role === 'supervisor') {
      return '/authenticated/supervisor'
    }
    if (userProfile?.role === 'student') {
      return '/authenticated/student'
    }
    if (userProfile?.role === 'admin') {
      return '/authenticated/admin'
    }
    return '/'
  }

  return (
    <header className="bg-blue-600 text-white page-padding py-4 sm:py-5 shadow-md sticky top-0 z-50 dark:bg-blue-800">
      <nav className="max-w-container mx-auto flex items-center justify-between" role="navigation" aria-label="Main navigation">
        {/* Logo Section */}
        <Link href="/" className="flex gap-2 sm:gap-4 hover:opacity-90 transition-opacity">
          <MentorMatchLogo 
            className="text-white flex-shrink-0 hidden sm:block" 
            size="md" 
          />
          <MentorMatchLogo 
            className="text-white flex-shrink-0 sm:hidden" 
            size="sm" 
          />
          <div>
            <h1 className="m-0 text-xl sm:text-2xl font-bold">MentorMatch</h1>
            <p className="m-0 text-xs opacity-90 hidden sm:block">Braude College of Engineering</p>
          </div>
        </Link>

        {/* Desktop User Avatar Section */}
        {user && userProfile && (
          <div className="hidden lg:block relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex gap-3 bg-white/10 hover:bg-white/20 rounded-full py-2 px-4 transition-colors cursor-pointer border-none"
              aria-label="User menu"
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              {/* Avatar or Initials */}
              {userProfile.photoURL ? (
                <Image
                  src={userProfile.photoURL}
                  alt={userProfile.name}
                  width={40}
                  height={40}
                  className={avatarSm}
                />
              ) : (
                <div className={avatarPlaceholderSm}>
                  {getInitials(userProfile.name)}
                </div>
              )}

              {/* User Name */}
              <span className="text-sm font-medium">
                {userProfile.name}
              </span>

              {/* Dropdown Arrow */}
              <svg
                className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <HeaderDropdown 
                userProfile={userProfile} 
                onClose={() => setShowDropdown(false)} 
              />
            )}
          </div>
        )}

        {/* Mobile Hamburger Button */}
        {user && userProfile && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="hamburger-btn"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div 
        ref={mobileMenuRef}
        className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu-open' : 'mobile-menu-closed'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Close Button */}
        <div className={`flex items-center justify-between p-4 ${borderBottom}`}>
          <span className={headingLg}>Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={touchTargetBtnLight}
            aria-label="Close menu"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        {userProfile && (
          <div className={`p-4 ${borderBottom}`}>
            <div className="flex items-center gap-3">
              {userProfile.photoURL ? (
                <Image
                  src={userProfile.photoURL}
                  alt={userProfile.name}
                  width={48}
                  height={48}
                  className={avatarMd}
                />
              ) : (
                <div className={avatarPlaceholderMd}>
                  {getInitials(userProfile.name)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800 dark:text-slate-100">{userProfile.name}</p>
                <p className={`text-sm ${textMuted}`}>{userProfile.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          <Link
            href={getDashboardLink()}
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavItem}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          {(userProfile?.role === 'student' || userProfile?.role === 'supervisor') && (
            <Link
              href={getProfileLink()}
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavItem}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          )}
        </nav>

        {/* Logout Button */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 ${borderTop}`}>
          <button
            onClick={handleLogout}
            className={logoutBtnFull}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
