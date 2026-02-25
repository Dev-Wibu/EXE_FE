import {
  Bell,
  Bot,
  CircleHelp,
  History,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Plus,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type TabType =
  | "overview"
  | "mockInterview"
  | "interviewHistory"
  | "feedback"
  | "aiInterview"
  | "aiChat"
  | "questions"
  | "community"
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
  mockInterview: Users,
  interviewHistory: History,
  feedback: MessageSquare,
  aiInterview: Bot,
  aiChat: MessageSquare,
  questions: CircleHelp,
  community: Newspaper,
  notifications: Bell,
  account: User,
};

const TAB_COLORS: Record<TabType, string> = {
  overview: "text-blue-600",
  mockInterview: "text-purple-600",
  interviewHistory: "text-orange-600",
  feedback: "text-cyan-600",
  aiInterview: "text-green-600",
  aiChat: "text-teal-600",
  questions: "text-yellow-600",
  community: "text-orange-500",
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
    <div className="flex items-end border-b bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
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
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-transparent bg-slate-100 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800"
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
                  className="flex-shrink-0 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-600">
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
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">
          <Plus className="h-4 w-4 dark:text-slate-300" />
        </button>

        {/* New Tab Menu */}
        {showNewTabMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNewTabMenu(false)} />
            <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-lg border bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => {
                  onNewTab("overview");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                Tổng quan
              </button>
              <button
                onClick={() => {
                  onNewTab("mockInterview");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Users className="h-4 w-4 text-purple-600" />
                Phỏng vấn với người hướng dẫn
              </button>
              <button
                onClick={() => {
                  onNewTab("interviewHistory");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <History className="h-4 w-4 text-orange-600" />
                Lịch sử phỏng vấn
              </button>
              <button
                onClick={() => {
                  onNewTab("feedback");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <MessageSquare className="h-4 w-4 text-cyan-600" />
                Phản hồi từ người hướng dẫn
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("aiInterview");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Bot className="h-4 w-4 text-green-600" />
                Phỏng vấn với AI
              </button>
              <button
                onClick={() => {
                  onNewTab("aiChat");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <MessageSquare className="h-4 w-4 text-teal-600" />
                Trò chuyện AI
              </button>
              <button
                onClick={() => {
                  onNewTab("questions");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <CircleHelp className="h-4 w-4 text-yellow-600" />
                Bộ câu hỏi
              </button>
              <button
                onClick={() => {
                  onNewTab("community");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Newspaper className="h-4 w-4 text-orange-500" />
                Cộng đồng
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("notifications");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
                <Bell className="h-4 w-4 text-red-600" />
                Thông báo
              </button>
              <button
                onClick={() => {
                  onNewTab("account");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700">
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
