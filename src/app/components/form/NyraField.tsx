import type { InputHTMLAttributes, ReactNode } from 'react';

const fieldClass =
  'w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 font-["Mulish",sans-serif] text-base text-[#1a1a1a] placeholder:text-gray-400 outline-none transition-shadow focus:border-[#a4a374] focus:ring-2 focus:ring-[#a4a374]/25';

export function NyraLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-[#303030] font-['Mulish',sans-serif]"
    >
      {children}
    </label>
  );
}

export function NyraInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />;
}

export function NyraFormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-600 font-['Mulish',sans-serif]">{message}</p>;
}

export function NyraFormCard({
  children,
  title,
  subtitle,
  className = '',
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-md rounded-[16px] border border-gray-100 bg-white p-8 shadow-sm ${className}`}
    >
      <h1 className="font-['Mulish',sans-serif] text-2xl font-bold text-[#1a1a1a]">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-gray-500 font-['Mulish',sans-serif]">{subtitle}</p>}
      <div className="mt-8 space-y-5">{children}</div>
    </div>
  );
}

export function NyraButton({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }) {
  const base =
    'inline-flex items-center justify-center rounded-full px-8 py-3.5 font-["Mulish",sans-serif] text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const styles =
    variant === 'primary'
      ? 'bg-[#a4a374] text-white hover:bg-[#8d8c5d]'
      : variant === 'outline'
        ? 'border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#fafafa]'
        : 'text-[#303030] hover:bg-gray-50';
  return (
    <button type={type} disabled={disabled} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
