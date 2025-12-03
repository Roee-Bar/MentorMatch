import React from 'react';

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
    <div className={`bg-white p-6 rounded-lg shadow border border-gray-200 ${className}`}>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormCard;

