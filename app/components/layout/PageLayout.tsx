import React from 'react';

type PageLayoutVariant = 'default' | 'narrow' | 'simple';

interface PageLayoutProps {
  variant?: PageLayoutVariant;
  children: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const containerClasses = {
    default: 'min-h-screen bg-gray-50 p-8',
    narrow: 'min-h-screen bg-gray-50 p-8',
    simple: 'min-h-screen bg-gray-50',
  };

  const contentClasses = {
    default: 'max-w-7xl mx-auto',
    narrow: 'max-w-5xl mx-auto',
    simple: 'max-w-7xl mx-auto',
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className={contentClasses[variant]}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;

