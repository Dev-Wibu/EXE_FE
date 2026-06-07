/**
 * Settings Store using Zustand with persistence
 * Manages FE-only preferences: appearance, productivity, notification prefs.
 * All settings are per-device and stored in localStorage.
 *
 * Schema versioning: bump SETTINGS_SCHEMA_VERSION when adding/removing fields
 * to trigger a graceful reset to defaults for existing users.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const SETTINGS_SCHEMA_VERSION = 3;

// ---------- Types ----------

export type FontSize = "small" | "default" | "large";
export type SidebarBehavior = "always-open" | "auto-collapse";
export type Language = "vi" | "en" | "ja";

export interface SettingsState {
  /** Internal schema version — used for future migrations */
  _version: number;

  // --- Appearance ---
  /** Font size preference (applied via data attribute on <html>) */
  fontSize: FontSize;
  /** UI language preference */
  language: Language;

  // --- Productivity ---
  /** How the desktop sidebar behaves on dashboards */
  sidebarBehavior: SidebarBehavior;

  // --- Notification Preferences (UI-only) ---
  /** When true, notification sound effects are disabled */
  muteSoundNotification: boolean;
  /** When true, sonner toast pop-ups are muted (won't render) */
  muteToastNotification: boolean;

  // --- Actions ---
  setFontSize: (v: FontSize) => void;
  setSidebarBehavior: (v: SidebarBehavior) => void;
  setMuteSoundNotification: (v: boolean) => void;
  setMuteToastNotification: (v: boolean) => void;
  setLanguage: (v: Language) => void;
  /** Reset all settings to factory defaults */
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: Omit<
  SettingsState,
  | "setFontSize"
  | "setLanguage"
  | "setSidebarBehavior"
  | "setMuteSoundNotification"
  | "setMuteToastNotification"
  | "resetToDefaults"
> = {
  _version: SETTINGS_SCHEMA_VERSION,
  fontSize: "default",
  language: "vi",
  sidebarBehavior: "always-open",
  muteSoundNotification: false,
  muteToastNotification: false,
};

// ---------- Font-size helpers ----------

export function applyFontSize(fontSize: FontSize): void {
  const root = document.documentElement;
  root.setAttribute("data-font-size", fontSize);
}

// ---------- Store ----------

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setFontSize: (fontSize) => {
        applyFontSize(fontSize);
        set({ fontSize });
      },
      setSidebarBehavior: (sidebarBehavior) => set({ sidebarBehavior }),
      setMuteSoundNotification: (muteSoundNotification) => set({ muteSoundNotification }),
      setMuteToastNotification: (muteToastNotification) => set({ muteToastNotification }),
      setLanguage: (language) => set({ language }),

      resetToDefaults: () => {
        applyFontSize(DEFAULT_SETTINGS.fontSize);
        set({ ...DEFAULT_SETTINGS });
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Version mismatch → reset to defaults (graceful migration)
        if (state._version !== SETTINGS_SCHEMA_VERSION) {
          state.resetToDefaults();
          return;
        }
        // Re-apply font size on page load
        applyFontSize(state.fontSize);
      },
    }
  )
);
