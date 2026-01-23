import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TabType =
  | "mentorApplications"
  | "sessions"
  | "userSupport"
  | "contentModeration";

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
              className="flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNewTab("mentorApplications")}
        className="h-8 w-8 p-0"
        title="Thêm tab mới">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
