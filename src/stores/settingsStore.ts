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

const SETTINGS_SCHEMA_VERSION = 1;

// ---------- Types ----------

export type FontSize = "small" | "default" | "large";
export type DisplayDensity = "compact" | "default";
export type SidebarBehavior = "always-open" | "auto-collapse";
export type DefaultPageSize = 10 | 20 | 50;

export interface SettingsState {
  /** Internal schema version — used for future migrations */
  _version: number;

  // --- Appearance ---
  /** Font size preference (applied via CSS class on <html>) */
  fontSize: FontSize;
  /** Display density: compact reduces padding/spacing globally */
  displayDensity: DisplayDensity;

  // --- Productivity ---
  /** How the desktop sidebar behaves on dashboards */
  sidebarBehavior: SidebarBehavior;
  /** Default page size used in all paginated tables */
  defaultPageSize: DefaultPageSize;

  // --- Notification Preferences (UI-only) ---
  /** When true, notification sound effects are disabled */
  muteSoundNotification: boolean;
  /** When true, sonner toast pop-ups are muted (won't render) */
  muteToastNotification: boolean;

  // --- Actions ---
  setFontSize: (v: FontSize) => void;
  setDisplayDensity: (v: DisplayDensity) => void;
  setSidebarBehavior: (v: SidebarBehavior) => void;
  setDefaultPageSize: (v: DefaultPageSize) => void;
  setMuteSoundNotification: (v: boolean) => void;
  setMuteToastNotification: (v: boolean) => void;
  /** Reset all settings to factory defaults */
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: Omit<
  SettingsState,
  | "setFontSize"
  | "setDisplayDensity"
  | "setSidebarBehavior"
  | "setDefaultPageSize"
  | "setMuteSoundNotification"
  | "setMuteToastNotification"
  | "resetToDefaults"
> = {
  _version: SETTINGS_SCHEMA_VERSION,
  fontSize: "default",
  displayDensity: "default",
  sidebarBehavior: "always-open",
  defaultPageSize: 10,
  muteSoundNotification: false,
  muteToastNotification: false,
};

// ---------- Font-size helpers ----------

const FONT_SIZE_CLASS: Record<FontSize, string> = {
  small: "text-size-small",
  default: "text-size-default",
  large: "text-size-large",
};

export function applyFontSize(fontSize: FontSize): void {
  const root = document.documentElement;
  Object.values(FONT_SIZE_CLASS).forEach((cls) => root.classList.remove(cls));
  root.classList.add(FONT_SIZE_CLASS[fontSize]);
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
      setDisplayDensity: (displayDensity) => set({ displayDensity }),
      setSidebarBehavior: (sidebarBehavior) => set({ sidebarBehavior }),
      setDefaultPageSize: (defaultPageSize) => set({ defaultPageSize }),
      setMuteSoundNotification: (muteSoundNotification) => set({ muteSoundNotification }),
      setMuteToastNotification: (muteToastNotification) => set({ muteToastNotification }),

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
