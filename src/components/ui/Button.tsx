'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, type, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 focus:ring-gray-300 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm',
    outline: 'border border-indigo-300 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-400',
  };

  // Generous min-heights so buttons clear the 44px Apple/Google touch-target guideline on phones.
  const sizes = {
    sm: 'text-sm px-3 py-2 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
  };

  // Default to type="button" — a bare <button> inside a <form> defaults to "submit"
  // and would fire the form on every click. Explicit "submit" is opt-in per usage.
  return (
    <button type={type ?? 'button'} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
