import { ChevronDown, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="h-40 w-full overflow-hidden bg-gradient-to-r from-white via-slate-50 to-sky-100">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-28 w-40 items-center justify-center">
            <Cpu className="h-12 w-12 text-blue-800" />
          </div>
          <span className="font-['Orelega_One'] text-2xl font-normal text-blue-800">
            AI INTERVIEW
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <div className="flex items-center gap-1 font-['Open_Sans'] text-xl font-normal text-neutral-900">
            <span>Câu hỏi</span>
            <ChevronDown className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 font-['Open_Sans'] text-xl font-normal text-neutral-900">
            <span>Tính năng</span>
            <ChevronDown className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1 font-['Open_Sans'] text-xl font-normal text-neutral-900">
            <span>Tài nguyên</span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="flex h-12 w-36 items-center justify-center rounded-2xl border border-black/20 bg-white font-['Open_Sans'] text-2xl font-normal text-neutral-900">
            Đăng nhập
          </Link>
          <Link
            to="/signup"
            className="flex h-12 w-44 items-center justify-center rounded-2xl bg-violet-600 font-['Open_Sans'] text-xl font-normal text-white">
            Bắt đầu
          </Link>
        </div>
      </div>
    </header>
  );
}
