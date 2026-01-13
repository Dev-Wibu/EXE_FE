import { Bot, CircleHelp, LayoutDashboard, LogOut, MessageSquare, User, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";

import { ThemeToggle } from "@/components/ThemeToggle";
import { authManager } from "@/services/auth.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const menuItems = [
  {
    label: "Tổng quan",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Phỏng vấn với Mentor",
    icon: Users,
    path: "/dashboard/mock-interview",
  },
  {
    label: "Phỏng vấn với AI",
    icon: Bot,
    path: "/dashboard/ai-interview",
  },
  {
    label: "AI Chat",
    icon: MessageSquare,
    path: "/dashboard/ai-chat",
  },
  {
    label: "Bộ câu hỏi",
    icon: CircleHelp,
    path: "/dashboard/questions",
  },
  {
    label: "Tài khoản",
    icon: User,
    path: "/dashboard/account",
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLogout = async () => {
    try {
      await authManager.logout();
      clearAuth();
      toast.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear auth and redirect even if API call fails
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6 dark:border-slate-800">
        <img src={icon2} alt="INBLUE AI" className="h-9 w-9" />
        <span className="text-lg font-bold text-[#002654] dark:text-white">INBLUE AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#0047AB]/10 text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}>
              <Icon
                className={`h-5 w-5 ${active ? "text-[#0047AB] dark:text-[#66B2FF]" : "text-slate-500 dark:text-slate-400"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Giao diện</span>
          <ThemeToggle iconOnly />
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
          <LogOut className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
