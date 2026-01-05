import { LayoutDashboard, LogOut, Settings, UserCog, Users, Video } from "lucide-react";

import { cn } from "@/lib/utils";

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
  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Manager Panel</h1>
          <p className="text-xs text-gray-500">Administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          Management
        </p>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => onNavigate(item.type)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentView === item.type
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}>
            <item.icon className={cn("h-5 w-5", item.color)} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
