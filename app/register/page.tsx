'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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
      setMessage('Creating your account...')

      // Call backend registration API
      const response = await apiClient.registerUser(formData)

      if (response.success) {
        setMessage('Registration successful! Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setMessage(response.error || 'Registration failed. Please try again.')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setMessage(error.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
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

          <div className="mb-5">
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

