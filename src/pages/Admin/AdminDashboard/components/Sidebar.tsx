import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Star,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import type { TabType } from "./ChromeTabs";

interface SidebarProps {
  onNavigate: (type: TabType) => void;
  currentView?: TabType;
}

const ADMIN_SIDEBAR_COLLAPSED_KEY = "admin_sidebar_collapsed";
// Migration: Keep old key for backwards compatibility
const LEGACY_SIDEBAR_KEY = "manager_sidebar_collapsed";

const MENU_ITEMS = [
  {
    type: "dashboard" as TabType,
    icon: LayoutDashboard,
    label: "Dashboard",
    color: "text-indigo-600",
  },
  { type: "users" as TabType, icon: Users, label: "Users", color: "text-blue-600" },
  { type: "mentors" as TabType, icon: UserCog, label: "Mentors", color: "text-orange-600" },
  { type: "sessions" as TabType, icon: Video, label: "Sessions", color: "text-green-600" },
];

const REVIEW_MENU_ITEMS = [
  { type: "reviews" as TabType, icon: Star, label: "Reviews", color: "text-yellow-600" },
  { type: "feedback" as TabType, icon: MessageSquare, label: "Feedback", color: "text-cyan-600" },
  {
    type: "notifications" as TabType,
    icon: Bell,
    label: "Notifications",
    color: "text-red-600",
  },
];

const QUESTION_MENU_ITEMS = [
  {
    type: "questionCategories" as TabType,
    icon: FolderOpen,
    label: "Categories",
    color: "text-purple-600",
  },
  {
    type: "questionMajors" as TabType,
    icon: GraduationCap,
    label: "Majors",
    color: "text-pink-600",
  },
  {
    type: "questionSets" as TabType,
    icon: BookOpen,
    label: "Question Sets",
    color: "text-teal-600",
  },
];

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Collapsible state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Migration: Check new key first, then fall back to legacy key
    const saved = localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) return saved === "true";

    // Check legacy key for migration
    const legacy = localStorage.getItem(LEGACY_SIDEBAR_KEY);
    if (legacy !== null) {
      // Migrate to new key and clean up
      localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, legacy);
      localStorage.removeItem(LEGACY_SIDEBAR_KEY);
      return legacy === "true";
    }

    return false;
  });

  useEffect(() => {
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    try {
      await authManager.logout();
      clearAuth();
      toast.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      navigate("/login");
    }
  };

  const renderMenuItem = (item: (typeof MENU_ITEMS)[0]) => {
    const buttonContent = (
      <button
        key={item.type}
        onClick={() => onNavigate(item.type)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          isCollapsed ? "justify-center px-2 py-2" : "px-3 py-2",
          currentView === item.type
            ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        )}>
        <item.icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
        {!isCollapsed && item.label}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.type}>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "relative flex h-full flex-col border-r bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900",
          isCollapsed ? "w-20" : "w-64"
        )}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-16 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-slate-400" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-3 border-b py-4 dark:border-slate-800",
            isCollapsed ? "justify-center px-2" : "px-4"
          )}>
          <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Administration</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 space-y-1", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed && (
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              Management
            </p>
          )}
          {MENU_ITEMS.map(renderMenuItem)}

          {!isCollapsed && (
            <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              Reviews & Feedback
            </p>
          )}
          {isCollapsed && <div className="my-2 border-t dark:border-slate-700" />}
          {REVIEW_MENU_ITEMS.map(renderMenuItem)}

          {!isCollapsed && (
            <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              Questions
            </p>
          )}
          {isCollapsed && <div className="my-2 border-t dark:border-slate-700" />}
          {QUESTION_MENU_ITEMS.map(renderMenuItem)}
        </nav>

        {/* Footer */}
        <div className={cn("border-t dark:border-slate-800", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ThemeToggle iconOnly />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                    <Settings className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                    <LogOut className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
