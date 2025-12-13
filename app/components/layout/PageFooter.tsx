import React from 'react';
import { bgFooter, textSecondary } from '@/lib/styles/shared-styles';

interface PageFooterProps {
  className?: string;
  companyName?: string;
  year?: number;
  additionalText?: string;
}

const PageFooter: React.FC<PageFooterProps> = ({
  className = '',
  companyName = 'MentorMatch - Braude College of Engineering',
  year = new Date().getFullYear(),
  additionalText,
}) => {
  return (
    <footer className={`mt-16 ${bgFooter} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className={`text-center ${textSecondary}`}>
          {companyName} © {year}
          {additionalText && ` - ${additionalText}`}
        </p>
      </div>
    </footer>
  );
};

export default PageFooter;


