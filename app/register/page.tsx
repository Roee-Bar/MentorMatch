'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api/client'
import { DEPARTMENTS, SKILLS_OPTIONS } from '@/lib/constants'
import FormInput from '@/app/components/form/FormInput'
import FormTextArea from '@/app/components/form/FormTextArea'
import FormSelect from '@/app/components/form/FormSelect'
import FormMultiSelect from '@/app/components/form/FormMultiSelect'
import FormSection from '@/app/components/form/FormSection'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import AuthLayout from '@/app/components/layout/AuthLayout'
import { btnPrimaryFullWidth, linkPrimary, cardFormSection, textMuted, headingXl } from '@/lib/styles/shared-styles'

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
    phone: '',
    department: '',
    // Academic
    skills: [] as string[],
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

  const handleSkillsChange = (selectedSkills: string[]) => {
    setFormData({
      ...formData,
      skills: selectedSkills
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

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters!')
      setLoading(false)
      return
    }

    // Check password complexity
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number!')
      setLoading(false)
      return
    }

    try {
      setMessage('Creating your account...')

      // Call backend registration API
      const response = await apiClient.registerUser(formData)

      if (response.success) {
        setMessage('Registration successful! Please check your email to verify your account.')
        setTimeout(() => {
          router.push('/login')
        }, 4000)
      } else {
        setMessage(response.error || 'Registration failed. Please try again.')
        setLoading(false)
      }
    } catch (error: any) {
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
          placeholder="yourname@e.braude.ac.il"
          helperText="Use your Braude email address (@e.braude.ac.il)"
          pattern="^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$"
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
            minLength={8}
            placeholder="Minimum 8 characters"
            helperText="Must contain uppercase, lowercase, and number"
          />
          <FormInput
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
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
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="050-1234567"
          />
          <FormSelect
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            placeholder="Select Department"
            options={[...DEPARTMENTS]}
          />
        </div>

        {/* Academic Information Section */}
        <FormSection title="Academic Information" />

        <FormMultiSelect
          label="Technical Skills"
          name="skills"
          value={formData.skills}
          onChange={handleSkillsChange}
          options={SKILLS_OPTIONS}
          required
          helperText="Select all skills that apply (you can choose multiple)"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimaryFullWidth} py-4 mt-6`}
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>

        {/* Status Message */}
        {message && (
          <StatusMessage
            message={message}
            type={message.includes('successful') ? 'success' : 'error'}
            className="mt-6"
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

