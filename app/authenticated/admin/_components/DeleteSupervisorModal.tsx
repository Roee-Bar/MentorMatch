'use client';

import { useState } from 'react';
import type { Supervisor } from '@/types/database';

interface DeleteSupervisorModalProps {
  supervisor: Supervisor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteSupervisorModal({ 
  supervisor, 
  isOpen, 
  onClose, 
  onSuccess 
}: DeleteSupervisorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const { apiClient } = await import('@/lib/api/client');
      const response = await apiClient.deleteSupervisor(supervisor.id, token);

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Failed to delete supervisor');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete supervisor. Please try again.');
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
        <h2 className="modal-title text-red-600">
          Delete Supervisor
        </h2>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete <strong>{supervisor.fullName || supervisor.email}</strong>?
          </p>
        </div>

        <div className="info-box-red mb-4">
          <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Warning: This action cannot be undone!</p>
          <p className="text-sm text-red-700">This will permanently delete:</p>
          <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
            <li>The supervisor account from Firebase Authentication</li>
            <li>All applications submitted to this supervisor</li>
            <li>All projects assigned to this supervisor</li>
            <li>Supervisor assignments from all students</li>
          </ul>
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
            type="button"
            onClick={handleDelete}
            className="btn-danger flex-1"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Supervisor'}
          </button>
        </div>
      </div>
    </div>
  );
}

