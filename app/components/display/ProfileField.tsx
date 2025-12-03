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
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <p className="text-gray-800 mt-1">{value || '-'}</p>
    </div>
  );
};

export default ProfileField;

