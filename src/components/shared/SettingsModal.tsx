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

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { type FontSize, type SidebarBehavior, useSettingsStore } from "@/stores/settingsStore";
import { applyTheme, type Theme, useThemeStore } from "@/stores/themeStore";
type SettingsTab = "appearance" | "productivity" | "notifications";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------- Tab sidebar config ----------

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "appearance", label: "Giao diện" },
  { id: "productivity", label: "Năng suất" },
  { id: "notifications", label: "Thông báo" },
];

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
        "flex flex-col items-center gap-2 rounded-xl border-2 px-5 py-4 text-sm font-medium transition-all",
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
  onCheckedChange: (v: boolean) => void;
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
  const { theme, setTheme } = useThemeStore();
  const { fontSize, setFontSize } = useSettingsStore();

  const themes: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
    { value: "light", label: "Sáng", icon: Sun },
    { value: "dark", label: "Tối", icon: Moon },
    { value: "system", label: "Hệ thống", icon: Monitor },
  ];

  const fontSizes: Array<{ value: FontSize; label: string; preview: string }> = [
    { value: "small", label: "Nhỏ", preview: "Aa" },
    { value: "default", label: "Mặc định", preview: "Aa" },
    { value: "large", label: "Lớn", preview: "Aa" },
  ];

  return (
    <div className="space-y-8">
      {/* Theme */}
      <div>
        <SectionTitle>Chủ đề màu sắc</SectionTitle>
        <div className="flex flex-wrap gap-3">
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
        <SectionTitle>Cỡ chữ</SectionTitle>
        <div className="flex flex-wrap gap-3">
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
    </div>
  );
}
function ProductivityPanel() {
  const { sidebarBehavior, setSidebarBehavior } = useSettingsStore();

  const sidebarOptions: Array<{ value: SidebarBehavior; label: string; description: string }> = [
    {
      value: "always-open",
      label: "Luôn mở",
      description: "Thanh bên luôn hiển thị trên màn hình lớn",
    },
    {
      value: "auto-collapse",
      label: "Tự động thu gọn",
      description: "Thanh bên tự thu gọn khi không sử dụng",
    },
  ];

  return (
    <div>
      {/* Sidebar behaviour */}
      <div>
        <SectionTitle>Hành vi thanh bên</SectionTitle>
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
  const {
    muteSoundNotification,
    setMuteSoundNotification,
    muteToastNotification,
    setMuteToastNotification,
  } = useSettingsStore();

  return (
    <div className="space-y-2">
      <SectionTitle>Tuỳ chọn thông báo</SectionTitle>
      <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800/50">
        <ToggleRow
          label="Tắt âm thanh thông báo"
          description="Không phát âm khi có thông báo mới"
          checked={muteSoundNotification}
          onCheckedChange={setMuteSoundNotification}
        />
        <Separator />
        <ToggleRow
          label="Tắt hiển thị toast"
          description="Không hiển thị popup toast khi có thông báo"
          checked={muteToastNotification}
          onCheckedChange={setMuteToastNotification}
        />
      </div>
    </div>
  );
}

// ---------- Main component ----------

export function SettingsModal({ open, onClose }: SettingsModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cài đặt hệ thống">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal shell */}
      <div className="relative z-10 flex h-[580px] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Left sidebar — tab list */}
        <div className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Cài đặt hệ thống
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
              Khôi phục mặc định
            </Button>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cài đặt"
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900">
            {activeTab === "appearance" && <AppearancePanel />}
            {activeTab === "productivity" && <ProductivityPanel />}
            {activeTab === "notifications" && <NotificationsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
