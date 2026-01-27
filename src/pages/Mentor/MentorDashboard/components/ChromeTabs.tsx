import {
  Bell,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type TabType =
  | "overview"
  | "sessions"
  | "students"
  | "reviews"
  | "feedback"
  | "notifications"
  | "account";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
}

interface ChromeTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: (type: TabType) => void;
}

const TAB_ICONS: Record<TabType, React.ElementType> = {
  overview: LayoutDashboard,
  sessions: Calendar,
  students: Users,
  reviews: Star,
  feedback: MessageSquare,
  notifications: Bell,
  account: User,
};

const TAB_COLORS: Record<TabType, string> = {
  overview: "text-emerald-600",
  sessions: "text-blue-600",
  students: "text-purple-600",
  reviews: "text-yellow-600",
  feedback: "text-cyan-600",
  notifications: "text-red-600",
  account: "text-gray-600",
};

export function ChromeTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}: ChromeTabsProps) {
  const [showNewTabMenu, setShowNewTabMenu] = useState(false);

  return (
    <div className="flex items-end border-b bg-emerald-50 dark:border-slate-800 dark:bg-slate-900">
      {/* Tab List */}
      <div className="flex items-end gap-0.5 overflow-x-auto px-2 pt-2">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.type];
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={cn(
                "group flex max-w-[200px] min-w-[120px] cursor-pointer items-center gap-2 rounded-t-lg border-x border-t px-3 py-2 transition-all",
                isActive
                  ? "border-emerald-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-transparent bg-emerald-100 hover:bg-emerald-50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              )}>
              <Icon className={cn("h-4 w-4 flex-shrink-0", TAB_COLORS[tab.type])} />
              <span className="flex-1 truncate text-sm font-medium dark:text-slate-200">
                {tab.title}
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="flex-shrink-0 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-emerald-200 dark:hover:bg-slate-600">
                  <X className="h-3 w-3 dark:text-slate-300" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <div className="relative mb-1 ml-1">
        <button
          onClick={() => setShowNewTabMenu(!showNewTabMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 transition-colors hover:bg-emerald-200 dark:bg-slate-700 dark:hover:bg-slate-600">
          <Plus className="h-4 w-4 dark:text-slate-300" />
        </button>

        {/* New Tab Menu */}
        {showNewTabMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNewTabMenu(false)} />
            <div className="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => {
                  onNewTab("overview");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                Tổng quan
              </button>
              <button
                onClick={() => {
                  onNewTab("sessions");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Calendar className="h-4 w-4 text-blue-600" />
                Phiên phỏng vấn
              </button>
              <button
                onClick={() => {
                  onNewTab("students");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Users className="h-4 w-4 text-purple-600" />
                Học viên
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("reviews");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Star className="h-4 w-4 text-yellow-600" />
                Đánh giá
              </button>
              <button
                onClick={() => {
                  onNewTab("feedback");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <MessageSquare className="h-4 w-4 text-cyan-600" />
                Phản hồi đã gửi
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("notifications");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Bell className="h-4 w-4 text-red-600" />
                Thông báo
              </button>
              <button
                onClick={() => {
                  onNewTab("account");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <User className="h-4 w-4 text-gray-600" />
                Tài khoản
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
