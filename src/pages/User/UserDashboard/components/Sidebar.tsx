import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

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

const SIDEBAR_COLLAPSED_KEY = "user_dashboard_sidebar_collapsed";

const MENU_ITEMS = [
  {
    type: "overview" as TabType,
    icon: LayoutDashboard,
    label: "Tổng quan",
    color: "text-blue-600",
  },
  {
    type: "mockInterview" as TabType,
    icon: Users,
    label: "Phỏng vấn với Mentor",
    color: "text-purple-600",
  },
  {
    type: "interviewHistory" as TabType,
    icon: History,
    label: "Lịch sử phỏng vấn",
    color: "text-orange-600",
  },
  {
    type: "feedback" as TabType,
    icon: MessageSquare,
    label: "Phản hồi từ Mentor",
    color: "text-cyan-600",
  },
];

const AI_MENU_ITEMS = [
  {
    type: "aiInterview" as TabType,
    icon: Bot,
    label: "Phỏng vấn với AI",
    color: "text-green-600",
  },
  {
    type: "aiChat" as TabType,
    icon: MessageSquare,
    label: "AI Chat",
    color: "text-teal-600",
  },
  {
    type: "questions" as TabType,
    icon: CircleHelp,
    label: "Bộ câu hỏi",
    color: "text-yellow-600",
  },
  {
    type: "community" as TabType,
    icon: Newspaper,
    label: "Cộng đồng",
    color: "text-orange-500",
  },
];

const SECONDARY_MENU_ITEMS = [
  {
    type: "notifications" as TabType,
    icon: Bell,
    label: "Thông báo",
    color: "text-red-600",
  },
  {
    type: "account" as TabType,
    icon: User,
    label: "Tài khoản",
    color: "text-gray-600",
  },
];

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
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
          isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          currentView === item.type
            ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        )}>
        <item.icon
          className={cn(
            "h-5 w-5 flex-shrink-0",
            currentView === item.type ? "text-[#0047AB] dark:text-[#66B2FF]" : item.color
          )}
        />
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
      <aside
        className={cn(
          "relative sticky top-0 flex h-screen flex-shrink-0 flex-col border-r border-slate-100 bg-slate-50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900",
          isCollapsed ? "w-20" : "w-72"
        )}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-slate-100 dark:border-slate-800",
            isCollapsed ? "justify-center px-2" : "px-6"
          )}>
          <img src={icon2} alt="INBLUE AI" className="h-9 w-9 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-lg font-bold text-[#002654] dark:text-white">INBLUE AI</span>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("flex flex-1 flex-col gap-1 py-4", isCollapsed ? "px-2" : "px-3")}>
          {!isCollapsed && (
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500/70 uppercase dark:text-slate-500">
              Phỏng vấn
            </p>
          )}
          {MENU_ITEMS.map(renderMenuItem)}

          {!isCollapsed && (
            <p className="mt-4 mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500/70 uppercase dark:text-slate-500">
              AI & Học tập
            </p>
          )}
          {isCollapsed && <div className="my-2 border-t border-slate-100 dark:border-slate-700" />}
          {AI_MENU_ITEMS.map(renderMenuItem)}

          {!isCollapsed && (
            <p className="mt-4 mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500/70 uppercase dark:text-slate-500">
              Cá nhân
            </p>
          )}
          {isCollapsed && <div className="my-2 border-t border-slate-100 dark:border-slate-700" />}
          {SECONDARY_MENU_ITEMS.map(renderMenuItem)}
        </nav>

        {/* Theme Toggle & Logout */}
        <div
          className={cn(
            "border-t border-slate-100 dark:border-slate-800",
            isCollapsed ? "p-2" : "p-3"
          )}>
          {!isCollapsed && (
            <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Giao diện
              </span>
              <ThemeToggle iconOnly />
            </div>
          )}

          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <ThemeToggle iconOnly />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                    <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
