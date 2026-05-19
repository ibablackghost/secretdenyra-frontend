import { ApiError, getApiErrorCode, toErrorMessage } from '../services/api/apiError';

const PRO_ERROR_MESSAGES: Record<string, string> = {
  ALREADY_PROFESSIONAL: 'Votre compte est déjà un compte professionnel.',
  REQUEST_ALREADY_PENDING: 'Une demande est déjà en cours d’examen. Nous vous recontacterons sous peu.',
  REQUEST_INVALID: 'Vérifiez les informations saisies (raison sociale obligatoire).',
};

export function proAccountErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code && PRO_ERROR_MESSAGES[code]) return PRO_ERROR_MESSAGES[code];
  if (error instanceof ApiError && error.status === 409) {
    return 'Cette action n’est pas possible dans l’état actuel de votre compte.';
  }
  return toErrorMessage(error, 'Impossible d’envoyer la demande pour le moment.');
}

export const PRO_REQUEST_STATUS_LABELS = {
  pending: 'En attente de validation',
  approved: 'Approuvée',
  rejected: 'Refusée',
} as const;
