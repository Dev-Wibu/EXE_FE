import {
  Bell,
  BookOpen,
  FileQuestion,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Plus,
  Star,
  Trophy,
  UserCog,
  Users,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type TabType =
  | "dashboard"
  | "users"
  | "mentors"
  | "sessions"
  | "reviews"
  | "feedback"
  | "notifications"
  | "questionCategories"
  | "questionMajors"
  | "questionSets"
  | "practiceQuestions"
  | "quizSets"
  | "posts"
  | "candidateProfiles";

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
  dashboard: LayoutDashboard,
  users: Users,
  mentors: UserCog,
  sessions: Video,
  reviews: Star,
  feedback: MessageSquare,
  notifications: Bell,
  questionCategories: FolderOpen,
  questionMajors: GraduationCap,
  questionSets: BookOpen,
  practiceQuestions: FileQuestion,
  quizSets: Trophy,
  posts: Newspaper,
  candidateProfiles: FileText,
};

const TAB_COLORS: Record<TabType, string> = {
  dashboard: "text-indigo-600",
  users: "text-blue-600",
  mentors: "text-orange-600",
  sessions: "text-green-600",
  reviews: "text-yellow-600",
  feedback: "text-cyan-600",
  notifications: "text-red-600",
  questionCategories: "text-purple-600",
  questionMajors: "text-pink-600",
  questionSets: "text-teal-600",
  practiceQuestions: "text-emerald-600",
  quizSets: "text-amber-600",
  posts: "text-purple-500",
  candidateProfiles: "text-teal-600",
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
    <div className="flex items-end border-b bg-gray-100 dark:border-slate-800 dark:bg-slate-900">
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
                  ? "border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-transparent bg-gray-200 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
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
                  className="flex-shrink-0 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-slate-600">
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
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 transition-colors hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600">
          <Plus className="h-4 w-4 dark:text-slate-300" />
        </button>

        {/* New Tab Menu */}
        {showNewTabMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNewTabMenu(false)} />
            <div className="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => {
                  onNewTab("dashboard");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                Dashboard
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("users");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <Users className="h-4 w-4 text-blue-600" />
                User Management
              </button>
              <button
                onClick={() => {
                  onNewTab("mentors");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <UserCog className="h-4 w-4 text-orange-600" />
                Mentor Management
              </button>
              <button
                onClick={() => {
                  onNewTab("sessions");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <Video className="h-4 w-4 text-green-600" />
                Session Management
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("reviews");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <Star className="h-4 w-4 text-yellow-600" />
                Review Management
              </button>
              <button
                onClick={() => {
                  onNewTab("feedback");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <MessageSquare className="h-4 w-4 text-cyan-600" />
                Feedback Management
              </button>
              <button
                onClick={() => {
                  onNewTab("notifications");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <Bell className="h-4 w-4 text-red-600" />
                Notification Management
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("questionCategories");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <FolderOpen className="h-4 w-4 text-purple-600" />
                Question Categories
              </button>
              <button
                onClick={() => {
                  onNewTab("questionMajors");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <GraduationCap className="h-4 w-4 text-pink-600" />
                Question Majors
              </button>
              <button
                onClick={() => {
                  onNewTab("questionSets");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <BookOpen className="h-4 w-4 text-teal-600" />
                Question Sets
              </button>
              <div className="my-1 border-t dark:border-slate-600" />
              <button
                onClick={() => {
                  onNewTab("posts");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <Newspaper className="h-4 w-4 text-purple-500" />
                Quản lý bài viết
              </button>
              <button
                onClick={() => {
                  onNewTab("candidateProfiles");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700">
                <FileText className="h-4 w-4 text-teal-600" />
                Hồ sơ ứng viên
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
