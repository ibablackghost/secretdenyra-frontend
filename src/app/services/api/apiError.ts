export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function toErrorMessage(error: unknown, fallback = 'Erreur inconnue.'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
