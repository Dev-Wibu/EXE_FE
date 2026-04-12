/**
 * Auth Store using Zustand with persistence
 * Manages authentication state including user info and JWT token
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { User } from "@/interfaces/schema.types";
import { getTokenExpiresAt, isSessionExpired } from "@/lib/auth-session";

const IS_API_MODE = import.meta.env.VITE_MANAGER_MODE === "api";

export interface AuthState {
  // State
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  expiresAt: number | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setExpiresAt: (_expiresAt: number | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      isLoggedIn: false,
      isLoading: true, // true until rehydration completes
      user: null,
      token: null,
      expiresAt: null,

      // Actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token, expiresAt: getTokenExpiresAt(token) }),
      setExpiresAt: (expiresAt) => set({ expiresAt }),
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setIsLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => {
        // Remove current user ID from localStorage on logout
        localStorage.removeItem("current-user-id");
        set({
          isLoggedIn: false,
          user: null,
          token: null,
          expiresAt: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
      }),
      // Set isLoading to false after rehydration completes
      onRehydrateStorage: () => (state) => {
        if (state) {
          const restoredExpiresAt = state.expiresAt ?? getTokenExpiresAt(state.token);

          if (state.expiresAt !== restoredExpiresAt) {
            state.setExpiresAt(restoredExpiresAt);
          }

          if (IS_API_MODE && state.isLoggedIn && isSessionExpired(restoredExpiresAt)) {
            state.clearAuth();
          }

          state.setIsLoading(false);
        }
      },
    }
  )
);

/**
 * Get the dashboard path for a given user role.
 */
export function getDashboardPath(role?: string): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin";
    case "MENTOR":
      return "/mentor";
    case "STAFF":
      return "/staff";
    default:
      return "/user";
  }
}
