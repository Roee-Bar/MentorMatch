'use client';

// Component for editing supervisor capacity with validation

import { useState } from 'react';
import type { Supervisor } from '@/types/database';
import FormInput from '@/app/components/form/FormInput';
import FormTextArea from '@/app/components/form/FormTextArea';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';
import StatusMessage from '@/app/components/feedback/StatusMessage';

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
  const [maxCapacity, setMaxCapacity] = useState(supervisor.maxCapacity.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const maxCapacityNum = parseInt(maxCapacity) || 0;

    // Validation
    if (maxCapacityNum < supervisor.currentCapacity) {
      setError(`Maximum capacity cannot be less than current capacity (${supervisor.currentCapacity})`);
      return;
    }

    if (maxCapacityNum > 50) {
      setError('Maximum capacity cannot exceed 50');
      return;
    }

    if (maxCapacityNum < 0) {
      setError('Maximum capacity cannot be negative');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this change');
      return;
    }

    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      await apiClient.updateSupervisorCapacity(
        supervisor.id,
        maxCapacityNum,
        reason,
        token
      );

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update capacity';
      setError(errorMessage);
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
          Edit Supervisor Capacity
        </h2>

        <div className="info-box-blue">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Supervisor:</span> {supervisor.fullName}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Department:</span> {supervisor.department}
          </p>
        </div>

        {/* Current vs New Capacity Comparison */}
        <div className="info-box-gray">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Current Capacity:</span>
            <span className="font-medium text-gray-800">
              {supervisor.currentCapacity} / {supervisor.maxCapacity}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">New Maximum:</span>
            <span className="font-medium text-blue-600">
              {supervisor.currentCapacity} / {maxCapacity || '0'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Max Capacity Input */}
          <FormInput
            id="maxCapacity"
            name="maxCapacity"
            type="number"
            label="Maximum Capacity"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            min={supervisor.currentCapacity}
            max={50}
            required
            helperText={`Must be between ${supervisor.currentCapacity} (current) and 50`}
            className="mb-4"
          />

          {/* Reason Textarea */}
          <FormTextArea
            id="reason"
            name="reason"
            label="Reason for Change"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this capacity change is needed..."
            required
            helperText="This will be logged for audit purposes"
            className="mb-4"
          />

          {/* Error Message */}
          {error && <StatusMessage message={error} type="error" className="mb-4" />}

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


