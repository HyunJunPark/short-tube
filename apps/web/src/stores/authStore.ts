import { create } from 'zustand'
import { UserWithoutPassword } from '@short-tube/types'

interface AuthState {
  user: UserWithoutPassword | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: UserWithoutPassword, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
