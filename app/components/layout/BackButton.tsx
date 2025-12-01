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
      className={`bg-transparent border-none text-blue-600 cursor-pointer text-sm mb-8 flex items-center gap-1 p-1 hover:underline ${className}`}
    >
      ← {label}
    </Link>
  );
};

export default BackButton;

