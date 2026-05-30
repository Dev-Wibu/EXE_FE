/**
 * Settings Modal (FE-only, per-device via localStorage)
 * Provides a Discord/Slack-style settings UI with tabs on the left and content on the right.
 *
 * Tabs:
 *  - Giao diện (Appearance): Theme, Font size
 *  - Năng suất (Productivity): Sidebar behaviour
 *  - Thông báo (Notification Preferences): Mute sound, Mute toast
 */

import { Monitor, Moon, RotateCcw, Sun, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  type FontSize,
  type Language,
  type SidebarBehavior,
  useSettingsStore,
} from "@/stores/settingsStore";
import { applyTheme, type Theme, useThemeStore } from "@/stores/themeStore";
type SettingsTab = "appearance" | "productivity" | "notifications";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// TABS moved inside component to use translations

// ---------- Sub-components ----------

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
      {children}
    </h3>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all",
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700"
      )}>
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (_v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ---------- Tab panels ----------

function AppearancePanel() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const { fontSize, setFontSize, language, setLanguage } = useSettingsStore();

  const handleLanguageChange = (lng: Language) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  const themes: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
    { value: "light", label: t("settings.theme_light"), icon: Sun },
    { value: "dark", label: t("settings.theme_dark"), icon: Moon },
    { value: "system", label: t("settings.theme_system"), icon: Monitor },
  ];

  const fontSizes: Array<{ value: FontSize; label: string; preview: string }> = [
    { value: "small", label: t("settings.font_small"), preview: "Aa" },
    { value: "default", label: t("settings.font_default"), preview: "Aa" },
    { value: "large", label: t("settings.font_large"), preview: "Aa" },
  ];

  const languages: Array<{ value: Language; label: string; preview: string }> = [
    { value: "vi", label: t("settings.language_vi"), preview: "VI" },
    { value: "en", label: t("settings.language_en"), preview: "EN" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Theme */}
      <div>
        <SectionTitle>{t("settings.color_theme")}</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <OptionCard key={value} selected={theme === value} onClick={() => setTheme(value)}>
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </OptionCard>
          ))}
        </div>
      </div>

      <Separator />

      {/* Font size */}
      <div>
        <SectionTitle>{t("settings.font_size")}</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {fontSizes.map(({ value, label, preview }) => (
            <OptionCard
              key={value}
              selected={fontSize === value}
              onClick={() => setFontSize(value)}>
              <span
                className={cn(
                  "leading-none font-bold",
                  value === "small" && "text-base",
                  value === "default" && "text-xl",
                  value === "large" && "text-3xl"
                )}>
                {preview}
              </span>
              <span className="text-xs">{label}</span>
            </OptionCard>
          ))}
        </div>
      </div>

      <Separator />

      {/* Language */}
      <div>
        <SectionTitle>{t("settings.language")}</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {languages.map(({ value, label, preview }) => (
            <OptionCard
              key={value}
              selected={language === value}
              onClick={() => handleLanguageChange(value)}>
              <span className="text-xl leading-none font-bold">{preview}</span>
              <span className="text-xs">{label}</span>
            </OptionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
function ProductivityPanel() {
  const { t } = useTranslation();
  const { sidebarBehavior, setSidebarBehavior } = useSettingsStore();

  const sidebarOptions: Array<{ value: SidebarBehavior; label: string; description: string }> = [
    {
      value: "always-open",
      label: t("settings.sidebar_always_open"),
      description: t("settings.sidebar_always_open_desc"),
    },
    {
      value: "auto-collapse",
      label: t("settings.sidebar_auto_collapse"),
      description: t("settings.sidebar_auto_collapse_desc"),
    },
  ];

  return (
    <div>
      {/* Sidebar behaviour */}
      <div>
        <SectionTitle>{t("settings.sidebar_behavior")}</SectionTitle>
        <RadioGroup
          value={sidebarBehavior}
          onValueChange={(v) => setSidebarBehavior(v as SidebarBehavior)}
          className="space-y-3">
          {sidebarOptions.map(({ value, label, description }) => (
            <div key={value} className="flex items-start gap-3">
              <RadioGroupItem value={value} id={`sidebar-${value}`} className="mt-0.5" />
              <div>
                <Label htmlFor={`sidebar-${value}`} className="cursor-pointer font-medium">
                  {label}
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const { t } = useTranslation();
  const {
    muteSoundNotification,
    setMuteSoundNotification,
    muteToastNotification,
    setMuteToastNotification,
  } = useSettingsStore();

  return (
    <div className="space-y-2">
      <SectionTitle>{t("settings.notification_preferences")}</SectionTitle>
      <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800/50">
        <ToggleRow
          label={t("settings.mute_sound")}
          description={t("settings.mute_sound_desc")}
          checked={muteSoundNotification}
          onCheckedChange={setMuteSoundNotification}
        />
        <Separator />
        <ToggleRow
          label={t("settings.mute_toast")}
          description={t("settings.mute_toast_desc")}
          checked={muteToastNotification}
          onCheckedChange={setMuteToastNotification}
        />
      </div>
    </div>
  );
}

// ---------- Main component ----------

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);
  const { setTheme } = useThemeStore();

  const handleResetToDefaults = () => {
    resetToDefaults();
    // Also reset theme to light (the store default)
    setTheme("light");
    applyTheme("light");
  };

  if (!open) return null;

  const TABS: Array<{ id: SettingsTab; label: string }> = [
    { id: "appearance", label: t("settings.appearance") },
    { id: "productivity", label: t("settings.productivity") },
    { id: "notifications", label: t("settings.notifications") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-stretch md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.system_settings")}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal shell */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-slate-50 shadow-none md:h-[580px] md:max-w-3xl md:flex-row md:rounded-2xl md:border md:border-slate-200 md:bg-slate-100 md:shadow-2xl dark:bg-slate-900 dark:md:border-slate-700 dark:md:bg-slate-900">
        {/* Mobile header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white/95 px-4 pt-[calc(0.9rem+env(safe-area-inset-top))] pb-3 backdrop-blur md:hidden dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mt-9">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t("settings.system_settings")}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("settings.system_settings_desc")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("settings.close")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile tab rail */}
        <div className="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-slate-700 dark:bg-slate-900/90">
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "min-h-11 rounded-2xl border px-2 py-2 text-center text-[11px] leading-tight font-semibold transition-all",
                  activeTab === tab.id
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                )}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop sidebar — tab list */}
        <div className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-slate-50 md:flex dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t("settings.system_settings")}
            </h2>
          </div>
          <nav className="flex-1 space-y-0.5 p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                )}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Reset to defaults */}
          <div className="border-t border-slate-200 p-3 dark:border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              onClick={handleResetToDefaults}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t("settings.reset_defaults")}
            </Button>
          </div>
        </div>

        {/* Desktop right content area */}
        <div className="hidden flex-1 flex-col overflow-hidden md:flex">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("settings.close")}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900">
            {activeTab === "appearance" && <AppearancePanel />}
            {activeTab === "productivity" && <ProductivityPanel />}
            {activeTab === "notifications" && <NotificationsPanel />}
          </div>
        </div>

        {/* Mobile content area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="space-y-5">
              {activeTab === "appearance" && <AppearancePanel />}
              {activeTab === "productivity" && <ProductivityPanel />}
              {activeTab === "notifications" && <NotificationsPanel />}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 rounded-2xl border border-slate-200/80 bg-white/90 text-slate-500 shadow-sm hover:bg-slate-100 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
              onClick={handleResetToDefaults}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t("settings.reset_defaults")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
