import React from 'react';
import { textSecondary, heading3xl } from '@/lib/styles/shared-styles';

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
          <h1 className={heading3xl}>{title}</h1>
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
      <h1 className={heading3xl}>{title}</h1>
      {description && (
        <p className={textSecondary}>{description}</p>
      )}
    </div>
  );
};

export default PageHeader;
