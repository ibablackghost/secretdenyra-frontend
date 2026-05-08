import { requestJson } from './httpClient';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

function ensureBaseUrl() {
  if (!STRAPI_URL) {
    throw new Error('VITE_STRAPI_URL est manquant. Configurez votre backend Strapi.');
  }
  return STRAPI_URL;
}

function url(path: string) {
  return `${ensureBaseUrl()}${path}`;
}

export type StrapiAuthUser = {
  id: number;
  username: string;
  email: string;
};

export type StrapiAuthResponse = {
  jwt: string;
  user: StrapiAuthUser;
};

export type MeProfile = {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export async function login(identifier: string, password: string) {
  return requestJson<StrapiAuthResponse>(url('/api/auth/local'), {
    method: 'POST',
    body: { identifier, password },
  });
}

export async function register(input: { username: string; email: string; password: string }) {
  return requestJson<StrapiAuthResponse>(url('/api/auth/local/register'), {
    method: 'POST',
    body: input,
  });
}

export async function getMe(token: string) {
  return requestJson<MeProfile>(url('/api/me'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateMe(token: string, input: { firstName?: string; lastName?: string; phone?: string }) {
  return requestJson<MeProfile>(url('/api/me'), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: input,
  });
}
