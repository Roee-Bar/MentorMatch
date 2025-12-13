'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { DEPARTMENTS } from '@/lib/constants'
import FormInput from '@/app/components/form/FormInput'
import FormTextArea from '@/app/components/form/FormTextArea'
import FormSelect from '@/app/components/form/FormSelect'
import FormSection from '@/app/components/form/FormSection'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import AuthLayout from '@/app/components/layout/AuthLayout'
import { btnPrimaryFullWidth, linkPrimary, cardFormSection, textMuted, headingXl, checkboxLg } from '@/lib/styles/shared-styles'

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
    <div className="py-10 px-5">
      <AuthLayout backHref="/" maxWidth="lg">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`${headingXl} mb-2.5`}>
            Create Account
          </h1>
          <p className={`${textMuted} text-base m-0`}>
            Create your MentorMatch account and complete your profile
          </p>
        </div>

        <form onSubmit={handleRegistration} noValidate className={cardFormSection}>
        
        {/* Account Information Section */}
        <FormSection title="Account Information" />

        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="student@braude.ac.il"
          helperText="Use your Braude email address"
          className="mb-5"
        />

        <div className="grid-form-2col">
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
          />
          <FormInput
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="Re-enter password"
          />
        </div>

        {/* Personal Information Section */}
        <FormSection title="Personal Information" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <FormInput
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="John"
          />
          <FormInput
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Doe"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <FormInput
            label="Student ID"
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            required
            placeholder="e.g., 312345678"
          />
          <FormInput
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="050-1234567"
          />
        </div>

        <FormSelect
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          placeholder="Select Department"
          options={[...DEPARTMENTS]}
          className="mb-5"
        />

        {/* Academic Information Section */}
        <FormSection title="Academic Information" />

        <FormInput
          label="Technical Skills"
          type="text"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          required
          placeholder="e.g., React, Python, Machine Learning, SQL"
          helperText="Separate skills with commas"
          className="mb-5"
        />

        <FormTextArea
          label="Research Interests"
          name="interests"
          value={formData.interests}
          onChange={handleChange}
          required
          placeholder="Describe your research interests and what kind of projects you're interested in..."
          rows={3}
          className="mb-5"
        />

        <FormTextArea
          label="Previous Projects (Optional)"
          name="previousProjects"
          value={formData.previousProjects}
          onChange={handleChange}
          placeholder="Describe any relevant projects you've worked on..."
          rows={2}
          className="mb-5"
        />

        <FormInput
          label="Preferred Project Topics (Optional)"
          type="text"
          name="preferredTopics"
          value={formData.preferredTopics}
          onChange={handleChange}
          placeholder="e.g., Web Development, AI, Mobile Apps, IoT"
          className="mb-5"
        />

        {/* Partner Information Section */}
        <FormSection title="Partner Information" />

        <div className="mb-6 p-4 rounded-xl border bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
          <label className="flex gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="hasPartner"
              checked={formData.hasPartner}
              onChange={handleChange}
              className={checkboxLg}
            />
            <span className="font-semibold text-blue-900 text-sm dark:text-blue-200">I have a project partner</span>
          </label>
        </div>

        {formData.hasPartner && (
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-slate-600">
            <div className="grid-form-2col">
              <FormInput
                label="Partner Name"
                type="text"
                name="partnerName"
                value={formData.partnerName}
                onChange={handleChange}
                required={formData.hasPartner}
                placeholder="Partner's full name"
              />
              <FormInput
                label="Partner Email"
                type="email"
                name="partnerEmail"
                value={formData.partnerEmail}
                onChange={handleChange}
                required={formData.hasPartner}
                placeholder="partner@braude.ac.il"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimaryFullWidth} py-4`}
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>

        {/* Status Message */}
        {message && (
          <StatusMessage
            message={message}
            type={message.includes('successful') ? 'success' : 'error'}
          />
        )}
      </form>

      {/* Already have account link */}
      <div className={`mt-8 text-center ${textMuted}`}>
        <p className="text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className={linkPrimary}
          >
            Login here
          </Link>
        </p>
      </div>
      </AuthLayout>
    </div>
  )
}

