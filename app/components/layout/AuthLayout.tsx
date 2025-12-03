import React from 'react';
import BackButton from '@/app/components/layout/BackButton';

type AuthLayoutMaxWidth = 'sm' | 'md' | 'lg';

interface AuthLayoutProps {
  backHref: string;
  maxWidth?: AuthLayoutMaxWidth;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  backHref,
  maxWidth = 'md',
  children,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-form',
  };

  return (
    <div className={`py-10 px-5 ${maxWidthClasses[maxWidth]} mx-auto`}>
      <BackButton href={backHref} />
      <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

