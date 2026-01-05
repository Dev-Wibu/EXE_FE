import { Plus, UserCog, Users, Video, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type TabType = "users" | "mentors" | "sessions";

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
  users: Users,
  mentors: UserCog,
  sessions: Video,
};

const TAB_COLORS: Record<TabType, string> = {
  users: "text-blue-600",
  mentors: "text-orange-600",
  sessions: "text-green-600",
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
    <div className="flex items-end border-b bg-gray-100">
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
                  ? "border-gray-300 bg-white"
                  : "border-transparent bg-gray-200 hover:bg-gray-100"
              )}>
              <Icon className={cn("h-4 w-4 flex-shrink-0", TAB_COLORS[tab.type])} />
              <span className="flex-1 truncate text-sm font-medium">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="flex-shrink-0 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-300">
                  <X className="h-3 w-3" />
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
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 transition-colors hover:bg-gray-300">
          <Plus className="h-4 w-4" />
        </button>

        {/* New Tab Menu */}
        {showNewTabMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNewTabMenu(false)} />
            <div className="absolute top-full left-0 z-20 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  onNewTab("users");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100">
                <Users className="h-4 w-4 text-blue-600" />
                User Management
              </button>
              <button
                onClick={() => {
                  onNewTab("mentors");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100">
                <UserCog className="h-4 w-4 text-orange-600" />
                Mentor Management
              </button>
              <button
                onClick={() => {
                  onNewTab("sessions");
                  setShowNewTabMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100">
                <Video className="h-4 w-4 text-green-600" />
                Session Management
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
