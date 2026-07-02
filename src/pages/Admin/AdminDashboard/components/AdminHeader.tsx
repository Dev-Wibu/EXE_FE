import { LanguageToggle } from "@/components/LanguageToggle";
import { SettingsModal } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Settings, Menu } from "lucide-react";
import { useState } from "react";

interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function AdminHeader({ title, onToggleSidebar, isSidebarCollapsed }: AdminHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-1 gap-4 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 h-9 w-9 md:hidden"
            onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
