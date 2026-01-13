import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={icon2} alt="INBLUE AI" className="h-10 w-10" />
          <span className="text-lg font-bold tracking-tight text-[#002654] dark:text-white">
            INBLUE AI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <button className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
            <span>Câu hỏi</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
            <span>Tính năng</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
            <span>Tài nguyên</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </nav>

        {/* Auth Buttons & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle iconOnly />
          <Button variant="ghost" className="text-slate-600 dark:text-slate-300" asChild>
            <Link to="/login">Đăng nhập</Link>
          </Button>
          <Button
            className="rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-6 shadow-sm hover:shadow-md"
            asChild>
            <Link to="/signup">Bắt đầu</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
