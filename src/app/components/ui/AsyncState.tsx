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
  return (
    <div className={`py-8 ${className}`} role="status" aria-live="polite" aria-label={message}>
      <span className="sr-only">{message}</span>
      <div className="mx-auto w-full max-w-[1100px] animate-pulse">
        <div className="mb-6 h-8 w-56 rounded-xl bg-gray-200/80" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`loading-card-${index}`} className="overflow-hidden rounded-[14px] border border-gray-100 bg-white p-4">
              <div className="h-44 w-full rounded-[10px] bg-gray-200/80" />
              <div className="mt-4 h-4 w-3/4 rounded bg-gray-200/80" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-200/70" />
              <div className="mt-6 h-10 w-full rounded-full bg-gray-200/80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
