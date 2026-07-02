import { LanguageToggle } from "@/components/LanguageToggle";
import { SettingsModal } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Settings, Menu, Search, Bell } from "lucide-react";
import { useState } from "react";

interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function AdminHeader({ title, onToggleSidebar }: AdminHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/85 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8 dark:border-slate-800/80 dark:bg-slate-900/85">
        <div className="flex flex-1 gap-4 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 h-9 w-9 md:hidden text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb style title for Desktop */}
          <nav className="hidden sm:flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2 text-sm">
              <li>
                <span className="text-gray-400 dark:text-slate-500 font-medium">Admin</span>
              </li>
              <li>
                <span className="text-gray-300 dark:text-slate-600 mx-2 text-lg leading-none">/</span>
              </li>
              <li>
                <span className="text-gray-900 dark:text-white font-semibold tracking-tight">{title}</span>
              </li>
            </ol>
          </nav>
          
          {/* Mobile title */}
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:hidden truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-x-3 lg:gap-x-5">
          {/* Search bar */}
          <div className="hidden md:flex relative max-w-xs items-center group">
            <Search className="absolute left-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="text"
              placeholder="Quick search..."
              className="block w-48 lg:w-64 rounded-full border-0 bg-gray-100/70 py-1.5 pl-9 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-transparent transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800/90"
            />
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block mx-1" aria-hidden="true" />
          
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white rounded-full">
            <Bell className="h-[18px] w-[18px]" />
          </Button>

          <LanguageToggle />
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white rounded-full"
            onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-[18px] w-[18px]" />
          </Button>
          
          {/* Profile Mockup */}
          <div className="flex items-center pl-2 ml-1 border-l border-gray-200 dark:border-slate-700">
            <button className="flex items-center gap-2 rounded-full p-1 transition-all hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-indigo-400 dark:hover:ring-offset-slate-900">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-xs font-semibold text-white">AD</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
