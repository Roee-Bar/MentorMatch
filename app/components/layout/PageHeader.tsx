import React from 'react';
import { textSecondary } from '@/lib/styles/shared-styles';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className = '',
}) => {
  if (action) {
    return (
      <div className={`mb-8 flex justify-between items-start ${className}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2 text-balance">{title}</h1>
          {description && (
            <p className={textSecondary}>{description}</p>
          )}
        </div>
        {action}
      </div>
    );
  }

  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-2 text-balance">{title}</h1>
      {description && (
        <p className={textSecondary}>{description}</p>
      )}
    </div>
  );
};

export default PageHeader;
