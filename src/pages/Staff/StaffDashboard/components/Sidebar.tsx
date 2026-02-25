import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
  Star,
  UserCheck,
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

const STAFF_SIDEBAR_COLLAPSED_KEY = "staff_sidebar_collapsed";

/**
 * Staff menu items - focused on operational/processing tasks
 * Differs from Admin menu which includes configuration and management features
 *
 * Staff responsibilities:
 * - Processing mentor applications (verification, approval)
 * - Managing session scheduling and issues
 * - User support and inquiries
 * - Content moderation (reviewing questions before publishing)
 * - Review moderation
 * - Feedback moderation
 */
const MENU_ITEMS = [
  {
    type: "mentorApplications" as TabType,
    icon: UserCheck,
    label: "Duyệt Mentor",
    color: "text-green-600",
    description: "Xử lý đăng ký mentor",
  },
  {
    type: "sessions" as TabType,
    icon: Video,
    label: "Phiên Phỏng Vấn",
    color: "text-blue-600",
    description: "Quản lý phiên phỏng vấn",
  },
  {
    type: "userSupport" as TabType,
    icon: Headphones,
    label: "Hỗ Trợ",
    color: "text-orange-600",
    description: "Hỗ trợ người dùng",
  },
  {
    type: "contentModeration" as TabType,
    icon: ClipboardCheck,
    label: "Kiểm Duyệt",
    color: "text-purple-600",
    description: "Kiểm duyệt nội dung",
  },
];

const MODERATION_MENU_ITEMS = [
  {
    type: "reviewModeration" as TabType,
    icon: Star,
    label: "Đánh Giá",
    color: "text-yellow-600",
    description: "Kiểm duyệt đánh giá",
  },
  {
    type: "feedbackModeration" as TabType,
    icon: MessageSquare,
    label: "Phản Hồi",
    color: "text-cyan-600",
    description: "Kiểm duyệt phản hồi",
  },
  {
    type: "postModeration" as TabType,
    icon: Newspaper,
    label: "Bài Viết",
    color: "text-purple-600",
    description: "Kiểm duyệt bài viết",
  },
];

export function Sidebar({ onNavigate, currentView }: SidebarProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Collapsible state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(STAFF_SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(STAFF_SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
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
            <div>
              <p>{item.label}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
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
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-600">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">Bảng Điều Phối</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Xử lý thường trực</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 space-y-1 overflow-y-auto", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed && (
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              Nghiệp Vụ
            </p>
          )}
          {MENU_ITEMS.map(renderMenuItem)}

          {!isCollapsed && (
            <p className="mt-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
              Kiểm Duyệt
            </p>
          )}
          {isCollapsed && <div className="my-2 border-t dark:border-slate-700" />}
          {MODERATION_MENU_ITEMS.map(renderMenuItem)}
        </nav>

        {/* Footer */}
        <div className={cn("border-t dark:border-slate-800", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed ? (
            <>
              <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  Giao diện
                </span>
                <ThemeToggle iconOnly />
              </div>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                <Settings className="h-5 w-5" />
                Cài đặt
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                <LogOut className="h-5 w-5" />
                Đăng xuất
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
                <TooltipContent side="right">Cài đặt</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                    <LogOut className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
