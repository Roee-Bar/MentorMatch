import React from 'react';

interface ProfileFieldProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-600 dark:text-slate-400">{label}</label>
      <p className="text-gray-800 dark:text-slate-200 mt-1">{value || '-'}</p>
    </div>
  );
};

export default ProfileField;

