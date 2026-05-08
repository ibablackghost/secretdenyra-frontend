import type { ReactNode } from 'react';

type LoadingStateProps = {
  message?: string;
  className?: string;
};

type ErrorStateProps = {
  message?: string;
  className?: string;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function LoadingState({ message = 'Chargement...', className = '' }: LoadingStateProps) {
  return <div className={`py-16 text-center text-gray-500 ${className}`}>{message}</div>;
}

export function ErrorState({ message = 'Une erreur est survenue.', className = '' }: ErrorStateProps) {
  return <div className={`py-16 text-center text-red-600 ${className}`}>{message}</div>;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`py-16 text-center ${className}`}>
      <h3 className="text-lg font-semibold text-[#1a1a1a]">{title}</h3>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
