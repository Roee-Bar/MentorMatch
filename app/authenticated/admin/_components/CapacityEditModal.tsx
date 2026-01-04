'use client';

// Component for editing supervisor capacity with validation

import { useState } from 'react';
import type { Supervisor } from '@/types/database';
import FormInput from '@/app/components/form/FormInput';
import FormTextArea from '@/app/components/form/FormTextArea';
import { validateCapacityUpdate } from '../_utils/capacityValidation';
import { 
  modalBackdrop, 
  modalContainer, 
  btnPrimary, 
  btnSecondary,
  infoBoxBlue,
  infoBoxGray,
  infoBoxRed,
  errorTextInline,
  cardDetailRow,
  textSecondary,
  textValue,
  textBody,
  headingXl,
  textBlueAccent
} from '@/lib/styles/shared-styles';

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
  const [maxCapacity, setMaxCapacity] = useState((supervisor?.maxCapacity ?? 0).toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const maxCapacityNum = parseInt(maxCapacity) || 0;

    // Validation using utility function
    const validation = validateCapacityUpdate(maxCapacityNum, supervisor, reason);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid capacity value');
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
        maxCapacityNum,
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
      className={modalBackdrop}
      onClick={handleBackdropClick}
      data-testid="edit-capacity-modal"
    >
      <div className={modalContainer}>
        <h2 className={`${headingXl} mb-4`}>
          Edit Supervisor Capacity
        </h2>

        <div className={`${infoBoxBlue} mb-4`}>
          <p className={textBody}>
            <span className="font-medium">Supervisor:</span> {supervisor.fullName}
          </p>
          <p className={textBody}>
            <span className="font-medium">Department:</span> {supervisor.department}
          </p>
        </div>

        {/* Current vs New Capacity Comparison */}
        <div className={`${infoBoxGray} mb-4`}>
          <div className={`${cardDetailRow} mb-2`}>
            <span className={textSecondary}>Current Capacity:</span>
            <span className={textValue}>
              {supervisor.currentCapacity} / {supervisor.maxCapacity}
            </span>
          </div>
          <div className={cardDetailRow}>
            <span className={textSecondary}>New Maximum:</span>
            <span className={textBlueAccent}>
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
          {error && (
            <div className={`mb-4 ${infoBoxRed}`}>
              <p className={errorTextInline}>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`${btnSecondary} flex-1`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${btnPrimary} flex-1`}
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
