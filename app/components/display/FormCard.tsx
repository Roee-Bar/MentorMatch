import React from 'react';
import { cardBase } from '@/lib/styles/shared-styles';

interface FormCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FormCard: React.FC<FormCardProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`${cardBase} ${className}`}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-slate-100">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormCard;
