import React from 'react';

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
      <h2 className="text-gray-800 dark:text-slate-100 mb-5 text-xl font-semibold border-b-2 border-blue-600 dark:border-blue-500 pb-2.5">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-600 dark:text-slate-400 text-sm mb-5">{subtitle}</p>
      )}
    </div>
  );
};

export default FormSection;


