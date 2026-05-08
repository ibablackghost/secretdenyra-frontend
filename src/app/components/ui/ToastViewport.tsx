import { X } from 'lucide-react';
import { useToastStore } from '@/app/store/toastStore';

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      className="pointer-events-none fixed right-4 top-24 z-[70] flex w-[min(360px,calc(100%-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-[12px] border px-4 py-3 shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-gray-200 bg-white text-gray-800'
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
          <button type="button" className="rounded p-1 hover:bg-black/5" onClick={() => dismiss(toast.id)} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
