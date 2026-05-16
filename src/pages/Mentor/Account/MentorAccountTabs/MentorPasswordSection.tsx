import { ChevronRight, Lock } from "lucide-react";

export function MentorPasswordSection() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Lock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
              Đổi mật khẩu
            </h3>
            <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
              Đổi mật khẩu để bảo mật tài khoản
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 font-['Inter'] text-base font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
          Thay đổi
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
