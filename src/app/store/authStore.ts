import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Profil utilisateur (sans mot de passe) */
export interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

/** Compte stocké localement — démo uniquement ; remplacer par Strapi en prod */
interface StoredAccount extends AuthUser {
  password: string;
}

interface AuthStore {
  user: AuthUser | null;
  accounts: StoredAccount[];
  login: (email: string, password: string) => { ok: true } | { ok: false; message: string };
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => { ok: true } | { ok: false; message: string };
  logout: () => void;
  updateProfile: (partial: Partial<Omit<AuthUser, 'email'>>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      login: (email, password) => {
        const normalized = email.trim().toLowerCase();
        const acc = get().accounts.find((a) => a.email === normalized);
        if (!acc) return { ok: false, message: 'Aucun compte avec cet e-mail.' };
        if (acc.password !== password) return { ok: false, message: 'Mot de passe incorrect.' };
        const { password: _, ...user } = acc;
        set({ user });
        return { ok: true };
      },
      register: ({ email, password, firstName, lastName }) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized || !password) {
          return { ok: false, message: 'E-mail et mot de passe obligatoires.' };
        }
        if (get().accounts.some((a) => a.email === normalized)) {
          return { ok: false, message: 'Un compte existe déjà avec cet e-mail.' };
        }
        if (password.length < 6) {
          return { ok: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' };
        }
        const newAcc: StoredAccount = {
          email: normalized,
          password,
          firstName: firstName.trim() || 'Client',
          lastName: lastName.trim() || 'Nyra',
          phone: '',
        };
        set((s) => ({
          accounts: [...s.accounts, newAcc],
          user: {
            email: newAcc.email,
            firstName: newAcc.firstName,
            lastName: newAcc.lastName,
            phone: newAcc.phone,
          },
        }));
        return { ok: true };
      },
      logout: () => set({ user: null }),
      updateProfile: (partial) => {
        const u = get().user;
        if (!u) return;
        const next: AuthUser = { ...u, ...partial };
        set({
          user: next,
          accounts: get().accounts.map((a) =>
            a.email === u.email ? { ...a, ...partial } : a
          ),
        });
      },
    }),
    { name: 'nyra-auth' }
  )
);
