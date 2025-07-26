import React from 'react';
import clsx from 'clsx';

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost';
  children: React.ReactNode;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  variant = 'outline',
  children,
  className,
  ...props
}) => {
  const baseStyles =
    'px-5 py-2 rounded-full text-white font-medium transition-all duration-300';
  const variants = {
    outline: 'border border-[#246BFD] hover:bg-[#246BFD]/10',
    ghost: 'border border-white/10 hover:border-white/20',
  };

  return (
    <button
      className={clsx(className,baseStyles, variants[variant] )}
      {...props}
    >
      {children}
    </button>
  );
};
