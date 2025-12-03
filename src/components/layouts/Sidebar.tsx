import {
  Bot,
  CircleHelp,
  Cpu,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  User,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="h-full w-80 overflow-hidden bg-slate-50">
      {/* Logo */}
      <div className="flex h-28 items-center gap-2 px-4">
        <Cpu className="h-12 w-12 text-blue-800" />
        <span className="font-['Orelega_One'] text-xl font-normal text-blue-800">AI INTERVIEW</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-12 px-4 pt-10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex h-20 w-full items-center gap-5 px-5 ${
                active
                  ? "rounded-[20px] bg-white outline outline-1 outline-offset-[-1px] outline-black"
                  : ""
              }`}>
              <Icon className={`h-11 w-11 ${active ? "text-black" : "text-gray-600"}`} />
              <span
                className={`font-['Open_Sans'] text-2xl leading-5 font-normal ${
                  active ? "text-black" : "text-black"
                }`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Logout button */}
        <button className="flex h-20 w-full items-center gap-5 px-5 text-left">
          <LogOut className="h-11 w-11 text-gray-600" />
          <span className="font-['Open_Sans'] text-2xl leading-5 font-normal text-black">
            Đăng xuất
          </span>
        </button>
      </nav>
    </aside>
  );
}
