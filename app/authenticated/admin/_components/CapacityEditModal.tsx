'use client';

// Component for editing supervisor capacity with validation

import { useState } from 'react';
import type { Supervisor } from '@/types/database';

interface CapacityEditModalProps {
  supervisor: Supervisor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CapacityEditModal({
  supervisor,
  isOpen,
  onClose,
  onSuccess
}: CapacityEditModalProps) {
  const [maxCapacity, setMaxCapacity] = useState(supervisor.maxCapacity);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (maxCapacity < supervisor.currentCapacity) {
      setError(`Maximum capacity cannot be less than current capacity (${supervisor.currentCapacity})`);
      return;
    }

    if (maxCapacity > 50) {
      setError('Maximum capacity cannot exceed 50');
      return;
    }

    if (maxCapacity < 0) {
      setError('Maximum capacity cannot be negative');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this change');
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
      await apiClient.updateSupervisorCapacity(
        supervisor.id,
        maxCapacity,
        reason,
        token
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update capacity');
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Edit Supervisor Capacity
        </h2>

        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Supervisor:</span> {supervisor.fullName}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Department:</span> {supervisor.department}
          </p>
        </div>

        {/* Current vs New Capacity Comparison */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Current Capacity:</span>
            <span className="font-medium text-gray-800">
              {supervisor.currentCapacity} / {supervisor.maxCapacity}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">New Maximum:</span>
            <span className="font-medium text-blue-600">
              {supervisor.currentCapacity} / {maxCapacity}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Max Capacity Input */}
          <div className="mb-4">
            <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="maxCapacity"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
              min={supervisor.currentCapacity}
              max={50}
              className="input-base w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be between {supervisor.currentCapacity} (current) and 50
            </p>
          </div>

          {/* Reason Textarea */}
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input-base w-full"
              placeholder="Explain why this capacity change is needed..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be logged for audit purposes
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
              {loading ? 'Updating...' : 'Update Capacity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


