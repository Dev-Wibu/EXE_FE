import { MessageSquare, Newspaper, Plus, Star, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TabType =
  | "mentorApplications"
  | "sessions"
  | "userSupport"
  | "contentModeration"
  | "reviewModeration"
  | "feedbackModeration"
  | "postModeration";

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

export function ChromeTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}: ChromeTabsProps) {
  return (
    <div className="flex h-10 items-center gap-1 border-b bg-gray-100 px-2 dark:border-slate-800 dark:bg-slate-900">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabSelect(tab.id)}
          className={cn(
            "group flex h-8 cursor-pointer items-center gap-2 rounded-t-lg border-x border-t px-3 text-sm transition-colors",
            tab.id === activeTabId
              ? "border-gray-200 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              : "border-transparent bg-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          )}>
          <span className="max-w-32 truncate">{tab.title}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Thêm tab mới">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onNewTab("mentorApplications")}>
            Duyệt Mentor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewTab("sessions")}>Phiên Phỏng Vấn</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewTab("userSupport")}>Hỗ Trợ</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewTab("contentModeration")}>
            Kiểm Duyệt Nội Dung
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onNewTab("reviewModeration")}>
            <Star className="mr-2 h-4 w-4 text-yellow-600" />
            Kiểm Duyệt Đánh Giá
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewTab("feedbackModeration")}>
            <MessageSquare className="mr-2 h-4 w-4 text-cyan-600" />
            Kiểm Duyệt Phản Hồi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewTab("postModeration")}>
            <Newspaper className="mr-2 h-4 w-4 text-purple-600" />
            Kiểm Duyệt Bài Viết
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
