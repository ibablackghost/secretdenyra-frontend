import { ApiError } from './apiError';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort('REQUEST_TIMEOUT'), timeoutMs);
  const combinedSignal = options.signal
    ? AbortSignal.any([options.signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: combinedSignal,
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new ApiError(
        `Erreur HTTP ${response.status} sur ${url}`,
        response.status,
        payload
      );
    }

    return payload as T;
  } catch (error) {
    if (timeoutController.signal.aborted) {
      throw new ApiError('Délai dépassé lors du chargement. Vérifiez Strapi/CORS.', 408);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
