'use client'

import React, { useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface StudentRegistrationProps {
  setCurrentView: (view: 'landing' | 'login' | 'signup') => void
}

export default function StudentRegistration({ setCurrentView }: StudentRegistrationProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  // Account Information (Step 1)
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Personal Information (Step 2)
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    phone: '',
    department: '',
    academicYear: ''
  })

  // Academic Information (Step 3)
  const [academicData, setAcademicData] = useState({
    skills: '',
    interests: '',
    previousProjects: '',
    preferredTopics: '',
    hasPartner: false,
    partnerName: '',
    partnerEmail: ''
  })

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validation
    if (accountData.password !== accountData.confirmPassword) {
      setMessage('❌ Passwords do not match!')
      setLoading(false)
      return
    }

    if (accountData.password.length < 6) {
      setMessage('❌ Password must be at least 6 characters!')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        accountData.email, 
        accountData.password
      )
      const user = userCredential.user

      // Step 2: Create user document in 'users' collection (for authentication/role)
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        email: accountData.email,
        name: `${personalData.firstName} ${personalData.lastName}`,
        role: 'student',
        createdAt: new Date()
      })

      // Step 3: Create complete student profile in 'students' collection
      await setDoc(doc(db, 'students', user.uid), {
        userId: user.uid,
        // Personal Information
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        fullName: `${personalData.firstName} ${personalData.lastName}`,
        email: accountData.email,
        studentId: personalData.studentId,
        phone: personalData.phone,
        department: personalData.department,
        academicYear: personalData.academicYear,
        // Academic Information
        skills: academicData.skills,
        interests: academicData.interests,
        previousProjects: academicData.previousProjects,
        preferredTopics: academicData.preferredTopics,
        // Partner Information
        hasPartner: academicData.hasPartner,
        partnerName: academicData.partnerName || '',
        partnerEmail: academicData.partnerEmail || '',
        // Status
        profileComplete: true,
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      setMessage('✅ Registration successful! Redirecting to dashboard...')
      
      // Redirect will happen automatically via auth state change
      setTimeout(() => {
        // The main page will detect the logged-in user and show dashboard
      }, 2000)

    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setMessage('❌ This email is already registered. Please login instead.')
      } else if (error.code === 'auth/invalid-email') {
        setMessage('❌ Invalid email address format.')
      } else if (error.code === 'auth/weak-password') {
        setMessage('❌ Password is too weak. Please use a stronger password.')
      } else {
        setMessage(`❌ Error: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    setCurrentStep(currentStep + 1)
    setMessage('')
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
    setMessage('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '700px',
        width: '100%'
      }}>
        {/* Back Button */}
        <button
          onClick={() => setCurrentView('landing')}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Back to Home
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#667eea', marginBottom: '10px', fontSize: '32px' }}>
            Student Registration
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Create your MentorMatch account and complete your profile
          </p>

          {/* Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: currentStep >= 1 ? '#667eea' : '#e5e7eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>1</div>
            <div style={{
              width: '50px',
              height: '2px',
              background: currentStep >= 2 ? '#667eea' : '#e5e7eb',
              alignSelf: 'center'
            }}></div>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: currentStep >= 2 ? '#667eea' : '#e5e7eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>2</div>
            <div style={{
              width: '50px',
              height: '2px',
              background: currentStep >= 3 ? '#667eea' : '#e5e7eb',
              alignSelf: 'center'
            }}></div>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: currentStep >= 3 ? '#667eea' : '#e5e7eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>3</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
            <span style={{ width: '100px', textAlign: 'center' }}>Account</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Personal</span>
            <span style={{ width: '100px', textAlign: 'center' }}>Academic</span>
          </div>
        </div>

        <form onSubmit={handleRegistration}>
          {/* Step 1: Account Information */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '24px' }}>
                Account Information
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  required
                  placeholder="student@braude.ac.il"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                <small style={{ color: '#6b7280', fontSize: '12px' }}>Use your Braude email address</small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Re-enter your password"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Next Step →
              </button>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '24px' }}>
                Personal Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={personalData.firstName}
                    onChange={(e) => setPersonalData({ ...personalData, firstName: e.target.value })}
                    required
                    placeholder="John"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={personalData.lastName}
                    onChange={(e) => setPersonalData({ ...personalData, lastName: e.target.value })}
                    required
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                    Student ID *
                  </label>
                  <input
                    type="text"
                    value={personalData.studentId}
                    onChange={(e) => setPersonalData({ ...personalData, studentId: e.target.value })}
                    required
                    placeholder="123456789"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    required
                    placeholder="050-1234567"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Department *
                </label>
                <select
                  value={personalData.department}
                  onChange={(e) => setPersonalData({ ...personalData, department: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Department</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Information Systems">Information Systems</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Academic Year *
                </label>
                <select
                  value={personalData.academicYear}
                  onChange={(e) => setPersonalData({ ...personalData, academicYear: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Academic Information */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '24px' }}>
                Academic Information
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Technical Skills *
                </label>
                <input
                  type="text"
                  value={academicData.skills}
                  onChange={(e) => setAcademicData({ ...academicData, skills: e.target.value })}
                  required
                  placeholder="e.g., React, Python, Machine Learning, SQL"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                <small style={{ color: '#6b7280', fontSize: '12px' }}>Separate skills with commas</small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Research Interests *
                </label>
                <textarea
                  value={academicData.interests}
                  onChange={(e) => setAcademicData({ ...academicData, interests: e.target.value })}
                  required
                  placeholder="Describe your research interests and what kind of projects you're interested in..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Previous Projects
                </label>
                <textarea
                  value={academicData.previousProjects}
                  onChange={(e) => setAcademicData({ ...academicData, previousProjects: e.target.value })}
                  placeholder="Describe any relevant projects you've worked on (optional)"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Preferred Project Topics
                </label>
                <input
                  type="text"
                  value={academicData.preferredTopics}
                  onChange={(e) => setAcademicData({ ...academicData, preferredTopics: e.target.value })}
                  placeholder="e.g., Web Development, AI, Mobile Apps, IoT"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={academicData.hasPartner}
                    onChange={(e) => setAcademicData({ ...academicData, hasPartner: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>I have a project partner</span>
                </label>
              </div>

              {academicData.hasPartner && (
                <div style={{ marginBottom: '20px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                  <h3 style={{ marginBottom: '15px', color: '#374151', fontSize: '18px' }}>Partner Information</h3>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                      Partner Name *
                    </label>
                    <input
                      type="text"
                      value={academicData.partnerName}
                      onChange={(e) => setAcademicData({ ...academicData, partnerName: e.target.value })}
                      required={academicData.hasPartner}
                      placeholder="Partner's full name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                      Partner Email *
                    </label>
                    <input
                      type="email"
                      value={academicData.partnerEmail}
                      onChange={(e) => setAcademicData({ ...academicData, partnerEmail: e.target.value })}
                      required={academicData.hasPartner}
                      placeholder="partner@braude.ac.il"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  ← Previous
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration ✓'}
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '8px',
              background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#991b1b',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {message}
            </div>
          )}
        </form>

        {/* Already have account link */}
        <div style={{ marginTop: '25px', textAlign: 'center', color: '#6b7280' }}>
          <p>
            Already have an account?{' '}
            <button
              onClick={() => setCurrentView('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'underline'
              }}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
