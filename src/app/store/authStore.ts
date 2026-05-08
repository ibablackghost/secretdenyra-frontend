import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiError } from '../services/api/apiError';
import * as authApi from '../services/api/authApi';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingMe: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
  updateProfile: (partial: Partial<Omit<AuthUser, 'id' | 'username' | 'email'>>) => Promise<void>;
}

function normalizeMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return details?.error?.message ?? details?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue.';
}

function toAuthUser(authUser: authApi.StrapiAuthUser, profile?: authApi.MeProfile): AuthUser {
  return {
    id: authUser.id,
    username: profile?.username ?? authUser.username,
    email: profile?.email ?? authUser.email,
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    phone: profile?.phone ?? '',
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoadingMe: false,
      login: async (email, password) => {
        try {
          const auth = await authApi.login(email.trim().toLowerCase(), password);
          const profile = await authApi.getMe(auth.jwt);
          set({
            token: auth.jwt,
            user: toAuthUser(auth.user, profile),
            isAuthenticated: true,
            isLoadingMe: false,
          });
        } catch (error) {
          throw new Error(normalizeMessage(error));
        }
      },
      register: async ({ email, password, firstName, lastName }) => {
        try {
          const normalized = email.trim().toLowerCase();
          const auth = await authApi.register({
            username: normalized.split('@')[0] || `user_${Date.now()}`,
            email: normalized,
            password,
          });
          const profile = await authApi.updateMe(auth.jwt, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });
          set({
            token: auth.jwt,
            user: toAuthUser(auth.user, profile),
            isAuthenticated: true,
            isLoadingMe: false,
          });
        } catch (error) {
          throw new Error(normalizeMessage(error));
        }
      },
      loadMe: async () => {
        const token = get().token;
        if (!token) return;
        set({ isLoadingMe: true });
        try {
          const profile = await authApi.getMe(token);
          const current = get().user;
          if (!current) {
            set({
              user: {
                id: profile.id ?? 0,
                username: profile.username,
                email: profile.email,
                firstName: profile.firstName ?? '',
                lastName: profile.lastName ?? '',
                phone: profile.phone ?? '',
              },
              isAuthenticated: true,
              isLoadingMe: false,
            });
            return;
          }
          set({
            user: {
              ...current,
              username: profile.username ?? current.username,
              email: profile.email ?? current.email,
              firstName: profile.firstName ?? current.firstName,
              lastName: profile.lastName ?? current.lastName,
              phone: profile.phone ?? current.phone,
            },
            isAuthenticated: true,
            isLoadingMe: false,
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            set({ token: null, user: null, isAuthenticated: false, isLoadingMe: false });
            return;
          }
          set({ isLoadingMe: false });
          throw new Error(normalizeMessage(error));
        }
      },
      logout: () => set({ token: null, user: null, isAuthenticated: false, isLoadingMe: false }),
      updateProfile: async (partial) => {
        const token = get().token;
        const user = get().user;
        if (!token || !user) return;
        try {
          const profile = await authApi.updateMe(token, partial);
          set({
            user: {
              ...user,
              firstName: profile.firstName ?? user.firstName,
              lastName: profile.lastName ?? user.lastName,
              phone: profile.phone ?? user.phone,
            },
          });
        } catch (error) {
          throw new Error(normalizeMessage(error));
        }
      },
    }),
    { name: 'nyra-auth' }
  )
);
