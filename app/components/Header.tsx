'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { onAuthChange, getUserProfile } from '@/lib/auth'
import { User } from 'firebase/auth'
import HeaderDropdown from './HeaderDropdown'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)
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

  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header className="bg-blue-600 text-white px-12 py-5 shadow-md sticky top-0 z-[1000]">
      <div className="max-w-container mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <span className="text-xl-custom">INSERT IMAGE HERE</span>
          <div>
            <h1 className="m-0 text-2xl font-bold">MentorMatch</h1>
            <p className="m-0 text-xs opacity-90">Braude College of Engineering</p>
          </div>
        </Link>

        {/* User Avatar Section */}
        {user && userProfile && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-full py-2 px-4 transition-colors cursor-pointer border-none"
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
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                  {getInitials(userProfile.name)}
                </div>
              )}

              {/* User Name */}
              <span className="text-sm font-medium hidden sm:block">
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
      </div>
    </header>
  );
}