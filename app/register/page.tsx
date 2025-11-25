'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { db, storage } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')

  // All form data in one state
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    // Personal
    firstName: '',
    lastName: '',
    studentId: '',
    phone: '',
    department: '',
    academicYear: '',
    // Academic
    skills: '',
    interests: '',
    previousProjects: '',
    preferredTopics: '',
    hasPartner: false,
    partnerName: '',
    partnerEmail: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name

    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file (JPG, PNG, WebP)')
        return
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setMessage('Image size must be less than 2MB')
        return
      }

      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setMessage('')
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const uploadPhoto = async (userId: string): Promise<string> => {
    if (!photoFile) return ''

    try {
      // Create a reference to the file location
      const fileExtension = photoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExtension}`
      const storageRef = ref(storage, `profile-photos/${userId}/${fileName}`)

      // Upload the file
      await uploadBytes(storageRef, photoFile)

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error('Photo upload error:', error)
      throw error
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match!')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters!')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      )
      const user = userCredential.user

      // Step 2: Upload photo if provided (non-critical - continue if it fails)
      let photoURL = ''
      if (photoFile) {
        try {
          setMessage('Uploading photo...')
          photoURL = await uploadPhoto(user.uid)
        } catch (photoError) {
          console.error('Photo upload failed, continuing without photo:', photoError)
          // Continue registration without photo - don't throw
        }
      }

      // Step 3: Create user document in 'users' collection
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'student',
        photoURL: photoURL,
        createdAt: new Date()
      })

      // Step 4: Create complete student profile in 'students' collection
      await setDoc(doc(db, 'students', user.uid), {
        userId: user.uid,
        // Personal Information
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        studentId: formData.studentId,
        phone: formData.phone,
        department: formData.department,
        academicYear: formData.academicYear,
        photoURL: photoURL,
        // Academic Information
        skills: formData.skills,
        interests: formData.interests,
        previousProjects: formData.previousProjects,
        preferredTopics: formData.preferredTopics,
        // Partner Information
        hasPartner: formData.hasPartner,
        partnerName: formData.partnerName || '',
        partnerEmail: formData.partnerEmail || '',
        // Status
        profileComplete: true,
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      setMessage('Registration successful! Redirecting to dashboard...')
      
      // Redirect to dashboard after successful registration
      // Auto-login happens via auth state change, but we'll redirect anyway
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        setMessage('This email is already registered. Please login instead.')
      } else if (error.code === 'auth/invalid-email') {
        setMessage('Invalid email address format.')
      } else if (error.code === 'auth/weak-password') {
        setMessage('Password is too weak. Please use a stronger password.')
      } else {
        setMessage(`Error: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
    }
    return ''
  }

  return (
    <div className="py-10 px-5 max-w-form mx-auto font-sans">
      {/* Back Button */}
      <Link
        href="/"
        className="bg-transparent border-none text-blue-600 cursor-pointer text-sm mb-8 flex items-center gap-1 p-1 hover:underline"
      >
        ← Back to Home
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-gray-800 mb-2.5 text-xl-custom font-bold">
          Create Account
        </h1>
        <p className="text-gray-500 text-base m-0">
          Create your MentorMatch account and complete your profile
        </p>
      </div>

      <form onSubmit={handleRegistration} noValidate className="bg-gray-50 p-10 rounded-xl border border-gray-200">
        
        {/* Account Information Section */}
        <div className="mb-10">
          <h2 className="text-gray-800 mb-5 text-xl font-semibold border-b-2 border-blue-600 pb-2.5">
            Account Information
          </h2>

          <div className="mb-5">
            <label htmlFor="email" className="label-base">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="student@braude.ac.il"
              className="input-base"
            />
            <small className="text-gray-500 text-xs">Use your Braude email address</small>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="label-base">
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label-base">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Re-enter password"
                className="input-base"
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-10">
          <h2 className="text-gray-800 mb-5 text-xl font-semibold border-b-2 border-blue-600 pb-2.5">
            Personal Information
          </h2>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label htmlFor="firstName" className="label-base">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label-base">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="label-base">
                Student ID *
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                placeholder="e.g., 312345678"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="050-1234567"
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="label-base">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="input-base"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Industrial Engineering">Industrial Engineering</option>
                <option value="Biotechnology">Biotechnology</option>
              </select>
            </div>
            <div>
              <label className="label-base">
                Academic Year *
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                required
                className="input-base"
              >
                <option value="">Select Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="mb-10">
          <h2 className="text-gray-800 mb-5 text-xl font-semibold border-b-2 border-blue-600 pb-2.5">
            Academic Information
          </h2>

          <div className="mb-5">
            <label className="label-base">
              Technical Skills *
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              required
              placeholder="e.g., React, Python, Machine Learning, SQL"
              className="input-base"
            />
            <small className="text-gray-500 text-xs">Separate skills with commas</small>
          </div>

          <div className="mb-5">
            <label className="label-base">
              Research Interests *
            </label>
            <textarea
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              required
              placeholder="Describe your research interests and what kind of projects you're interested in..."
              rows={3}
              className="textarea-base"
            />
          </div>

          <div className="mb-5">
            <label className="label-base">
              Previous Projects (Optional)
            </label>
            <textarea
              name="previousProjects"
              value={formData.previousProjects}
              onChange={handleChange}
              placeholder="Describe any relevant projects you've worked on..."
              rows={2}
              className="textarea-base"
            />
          </div>

          <div className="mb-5">
            <label className="label-base">
              Preferred Project Topics (Optional)
            </label>
            <input
              type="text"
              name="preferredTopics"
              value={formData.preferredTopics}
              onChange={handleChange}
              placeholder="e.g., Web Development, AI, Mobile Apps, IoT"
              className="input-base"
            />
          </div>
        </div>

        {/* Partner Information Section */}
        <div className="mb-10">
          <h2 className="text-gray-800 mb-5 text-xl font-semibold border-b-2 border-blue-600 pb-2.5">
            Partner Information
          </h2>

          <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="hasPartner"
                checked={formData.hasPartner}
                onChange={handleChange}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span className="font-semibold text-blue-900 text-sm">I have a project partner</span>
            </label>
          </div>

          {formData.hasPartner && (
            <div className="p-5 bg-white rounded-lg border border-gray-300">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label-base">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleChange}
                    required={formData.hasPartner}
                    placeholder="Partner's full name"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base">
                    Partner Email *
                  </label>
                  <input
                    type="email"
                    name="partnerEmail"
                    value={formData.partnerEmail}
                    onChange={handleChange}
                    required={formData.hasPartner}
                    placeholder="partner@braude.ac.il"
                    className="input-base"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Photo Section */}
        <div className="mb-8">
          <h2 className="text-gray-800 mb-5 text-xl font-semibold border-b-2 border-blue-600 pb-2.5">
            Profile Photo (Optional)
          </h2>

          <div className="flex items-start gap-6">
            {/* Photo Preview */}
            <div className="flex-shrink-0">
              {photoPreview ? (
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-200">
                  {getInitials() || '?'}
                </div>
              )}
            </div>

            {/* Upload Section */}
            <div className="flex-1">
              <label className="label-base">
                Upload Your Photo
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Choose a professional photo. Max size: 2MB. Formats: JPG, PNG, WebP
              </p>
              
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              
              <p className="text-xs text-gray-400 mt-2">
                Tip: If you dont upload a photo, well use your initials ({getInitials() || 'XX'})
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4"
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>

        {/* Status Message */}
        {message && (
          <div className={`mt-5 ${
            message.includes('successful') 
              ? 'badge-success' 
              : message.includes('Uploading')
              ? 'badge-info'
              : 'badge-danger'
          }`}>
            {message}
          </div>
        )}
      </form>

      {/* Already have account link */}
      <div className="mt-8 text-center text-gray-500">
        <p className="text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="bg-transparent border-none text-blue-600 cursor-pointer font-bold underline text-sm hover:text-blue-700"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

