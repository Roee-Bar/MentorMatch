import React from 'react';
import { btnPrimary, btnSecondary } from '@/lib/styles/shared-styles';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  isLoading: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  submitType?: 'submit' | 'button';
}

const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onSubmit,
  isLoading,
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  submitType = 'submit',
}) => {
  return (
    <div className="flex gap-4 justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className={btnSecondary}
      >
        {cancelLabel}
      </button>
      <button
        type={submitType}
        onClick={onSubmit}
        disabled={isLoading}
        className={btnPrimary}
      >
        {isLoading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
};

export default FormActions;

