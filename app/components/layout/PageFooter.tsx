import React from 'react';

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
    <footer className={`mt-16 bg-white border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">
          {companyName} © {year}
          {additionalText && ` - ${additionalText}`}
        </p>
      </div>
    </footer>
  );
};

export default PageFooter;


