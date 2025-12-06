'use client';

import { useState } from 'react';
import type { Supervisor } from '@/types/database';
import FormInput from '@/app/components/form/FormInput';

interface RegisterSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterSupervisorModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: RegisterSupervisorModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const { apiClient } = await import('@/lib/api/client');
      const response = await apiClient.createSupervisor(email, token);

      if (response.success) {
        onSuccess();
        onClose();
        setEmail('');
      } else {
        setError(response.error || 'Failed to create supervisor');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create supervisor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="modal-container">
        <h2 className="modal-title">
          Register New Supervisor
        </h2>

        <div className="info-box-blue mb-4">
          <p className="text-sm text-gray-700">
            Enter supervisor email. Default password: <span className="font-mono font-medium">Supervisor123</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="supervisor@university.edu"
            required
            disabled={loading}
            className="mb-4"
          />

          <div className="info-box-blue mb-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> The supervisor will need to complete their profile and change their password after first login.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

