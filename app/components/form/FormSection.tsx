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
      <h2 className="text-gray-800 mb-5 text-xl font-semibold border-b-2 border-blue-600 pb-2.5">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-600 text-sm mb-5">{subtitle}</p>
      )}
    </div>
  );
};

export default FormSection;


