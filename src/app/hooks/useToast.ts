import { useToastStore, type ToastType } from '@/app/store/toastStore';

export function useToast() {
  const push = useToastStore((state) => state.push);

  return {
    showToast: (message: string, type: ToastType = 'info') => push({ message, type }),
    success: (message: string) => push({ message, type: 'success' }),
    error: (message: string) => push({ message, type: 'error' }),
    info: (message: string) => push({ message, type: 'info' }),
  };
}
