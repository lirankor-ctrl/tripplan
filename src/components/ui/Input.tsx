import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const inputBase = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-right placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-200';

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700 text-right">{label}</label>}
      <input dir="rtl" className={cn(inputBase, error && 'border-red-300 focus:border-red-400', className)} {...props} />
      {error && <p className="text-xs text-red-500 text-right">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700 text-right">{label}</label>}
      <textarea dir="rtl" className={cn(inputBase, 'resize-none', error && 'border-red-300', className)} {...props} />
      {error && <p className="text-xs text-red-500 text-right">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700 text-right">{label}</label>}
      <select dir="rtl" className={cn(inputBase, 'cursor-pointer', error && 'border-red-300', className)} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500 text-right">{error}</p>}
    </div>
  );
}
