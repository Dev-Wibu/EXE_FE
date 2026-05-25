import { Facebook, Globe, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function HomepageFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        {/* Logo & Copyright */}
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="text-lg font-bold text-[#0047AB] dark:text-[#66B2FF]">INBLUE AI</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 INBLUE AI - Nền tảng luyện phỏng vấn thông minh
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link
            to="#"
            className="text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-400 dark:hover:text-[#66B2FF]">
            Quy định
          </Link>
          <Link
            to="#"
            className="text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-400 dark:hover:text-[#66B2FF]">
            Bảo mật
          </Link>
          <Link
            to="#"
            className="text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-400 dark:hover:text-[#66B2FF]">
            Hỗ trợ kỹ thuật
          </Link>
          <Link
            to="#"
            className="text-slate-600 transition-colors hover:text-[#0047AB] dark:text-slate-400 dark:hover:text-[#66B2FF]">
            Liên hệ
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex gap-3">
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-[#0047AB]/50 hover:bg-[#0047AB]/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-[#66B2FF]/50 dark:hover:bg-[#66B2FF]/10">
            <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-[#0047AB]/50 hover:bg-[#0047AB]/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-[#66B2FF]/50 dark:hover:bg-[#66B2FF]/10">
            <Facebook className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-[#0047AB]/50 hover:bg-[#0047AB]/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-[#66B2FF]/50 dark:hover:bg-[#66B2FF]/10">
            <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </a>
        </div>
      </div>
    </footer>
  );
}
