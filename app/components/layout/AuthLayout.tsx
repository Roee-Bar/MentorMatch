import React from 'react';
import BackButton from '@/app/components/layout/BackButton';
import { cardAuth } from '@/lib/styles/shared-styles';

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
      <div className={cardAuth}>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

