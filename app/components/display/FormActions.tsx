import React from 'react';

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
        className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
      >
        {cancelLabel}
      </button>
      <button
        type={submitType}
        onClick={onSubmit}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
};

export default FormActions;

