'use client'

import { useState, useEffect, useRef } from 'react'
import { onAuthChange, signOut, getUserProfile } from '@/lib/auth'
import { User } from 'firebase/auth'

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

  const handleLogout = async () => {
    await signOut()
    setShowDropdown(false)
  }

  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header className="bg-blue-600 text-white px-12 py-5 shadow-md sticky top-0 z-[1000]">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <span className="text-[32px]">🎓</span>
          <div>
            <h1 className="m-0 text-2xl font-bold">MentorMatch</h1>
            <p className="m-0 text-xs opacity-90">Braude College of Engineering</p>
          </div>
        </div>

        {/* User Avatar Section */}
        {user && userProfile && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-full py-2 px-4 transition-colors cursor-pointer border-none"
            >
              {/* Avatar or Initials */}
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.name}
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-800">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold">{userProfile.name}</p>
                  <p className="text-xs text-gray-500">{userProfile.email}</p>
                </div>
                
                <button
                  onClick={() => {/* TODO: Navigate to profile */}}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600 border-none bg-transparent cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}