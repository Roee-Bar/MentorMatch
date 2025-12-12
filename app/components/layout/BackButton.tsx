import React from 'react';
import Link from 'next/link';

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  href,
  label = 'Back to Home',
  className = '',
}) => {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-8 p-1 hover:underline ${className}`}
    >
      ← {label}
    </Link>
  );
};

export default BackButton;


