'use client';

// app/components/shared/ConfirmModal.tsx
// Reusable confirmation modal for destructive and confirmation actions
// Replaces native browser confirm() dialogs for better UX and testability

import { modalBackdrop, modalContainer, btnSecondary, btnDanger, btnSuccess, headingLg, textSecondary } from '@/lib/styles/shared-styles';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass = variant === 'success' ? btnSuccess : btnDanger;

  return (
    <div className={modalBackdrop}>
      <div className={modalContainer}>
        <h3 className={`${headingLg} mb-2`}>{title}</h3>
        <p className={`${textSecondary} mb-6`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={btnSecondary}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmButtonClass}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
