import React from 'react';
import { heading2xl } from '@/lib/styles/shared-styles';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h2 className={heading2xl}>{title}</h2>
      {badge}
      {action}
    </div>
  );
};

export default SectionHeader;

