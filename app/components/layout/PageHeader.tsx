import React from 'react';
import Link from 'next/link';

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
}

interface PageHeaderProps {
  navigationItems?: NavigationItem[];
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  navigationItems = [],
  className = '',
}) => {
  return (
    <header className={`bg-white shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <svg 
                className="w-10 h-10 text-blue-600" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <h1 className="text-3xl font-bold text-gray-900">MentorMatch</h1>
            </Link>
          </div>
          {navigationItems.length > 0 && (
            <nav className="flex items-center gap-4">
              {navigationItems.map((item, index) => (
                item.active ? (
                  <span key={index} className="text-blue-600 font-medium">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;

