import React from 'react';
import { textSecondary, headingXl } from '@/lib/styles/shared-styles';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`mb-10 ${className}`}>
      <h2 className={`${headingXl} font-semibold mb-5 border-b-2 border-blue-600 dark:border-blue-500 pb-2.5`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`${textSecondary} text-sm mb-5`}>{subtitle}</p>
      )}
    </div>
  );
};

export default FormSection;


