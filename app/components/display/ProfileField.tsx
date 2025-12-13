import React from 'react';
import { profileLabel, profileValue } from '@/lib/styles/shared-styles';

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
      <label className={profileLabel}>{label}</label>
      <p className={profileValue}>{value || '-'}</p>
    </div>
  );
};

export default ProfileField;

