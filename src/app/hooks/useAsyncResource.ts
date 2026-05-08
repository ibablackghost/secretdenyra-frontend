import { useEffect, useState } from 'react';
import { toErrorMessage } from '@/app/services/api/apiError';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<T> = {
  data: T;
  status: AsyncStatus;
  loading: boolean;
  error: string | null;
};

export function useAsyncResource<T>(load: (signal: AbortSignal) => Promise<T>, initialData: T): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    status: 'loading',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, status: 'loading', loading: true, error: null }));

    load(controller.signal)
      .then((data) => {
        setState({ data, status: 'success', loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: initialData,
          status: 'error',
          loading: false,
          error: toErrorMessage(error),
        });
      });

    return () => controller.abort();
  }, [load, initialData]);

  return state;
}
