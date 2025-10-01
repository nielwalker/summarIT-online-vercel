import { create } from 'zustand'

export type UserRole = 'student' | 'coordinator' | 'chairman'

type AuthState = {
  token: string | null
  role: UserRole | null
  userName: string | null
  login: (args: { token: string; role: UserRole; userName: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  userName: null,
  login: ({ token, role, userName }) => set({ token, role, userName }),
  logout: () => set({ token: null, role: null, userName: null }),
}))


