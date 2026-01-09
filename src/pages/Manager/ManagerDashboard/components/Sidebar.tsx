import { LayoutDashboard, LogOut, Settings, UserCog, Users, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import type { TabType } from "./ChromeTabs";

interface SidebarProps {
  onNavigate: (type: TabType) => void;
  currentView?: TabType;
}

const MENU_ITEMS = [
  { type: "users" as TabType, icon: Users, label: "Users", color: "text-blue-600" },
  { type: "mentors" as TabType, icon: UserCog, label: "Mentors", color: "text-orange-600" },
  { type: "sessions" as TabType, icon: Video, label: "Sessions", color: "text-green-600" },
];

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    try {
      await authManager.logout();
      clearAuth();
      toast.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear auth and redirect even if API call fails
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-4 py-4 dark:border-slate-800">
        <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 dark:text-white">Manager Panel</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">Administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
          Management
        </p>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => onNavigate(item.type)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentView === item.type
                ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            )}>
            <item.icon className={cn("h-5 w-5", item.color)} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Theme</span>
          <ThemeToggle iconOnly />
        </div>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
