import { create } from 'zustand'
import { UserSummary, AuthTokens } from '@flowboard/shared-types'

interface AuthState {
  user: UserSummary | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: UserSummary, tokens: AuthTokens) => void
  setTokens: (tokens: AuthTokens) => void
  setUser: (user: UserSummary) => void
  clearAuth: () => void
  initAuth: () => void
}

const STORAGE_KEYS = {
  USER: 'flowboard_user',
  ACCESS_TOKEN: 'flowboard_access_token',
  REFRESH_TOKEN: 'flowboard_refresh_token',
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user, tokens) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)

    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      isInitialized: true,
    })
  },

  setTokens: (tokens) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)

    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  },

  setUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    set({ user })
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  initAuth: () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
      const storedAccess = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (storedUser && storedAccess && storedRefresh) {
        set({
          user: JSON.parse(storedUser),
          accessToken: storedAccess,
          refreshToken: storedRefresh,
          isAuthenticated: true,
          isInitialized: true,
        })
        return
      }
    } catch {
      // Ignore corrupted localStorage data and reset
    }

    set({ isInitialized: true, isAuthenticated: false })
  },
}))
