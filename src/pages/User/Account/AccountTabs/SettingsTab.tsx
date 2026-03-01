import { Bell, Globe } from "lucide-react";

import type { UserSettings } from "@/mocks/user.mock";

interface SettingsTabProps {
  settings: UserSettings;
}

function NotificationToggle({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
      <div>
        <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
          {title}
        </p>
        <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <button
        className={`relative h-7 w-12 rounded-full transition-colors ${
          enabled ? "bg-[#0047AB]" : "bg-gray-300 dark:bg-slate-600"
        }`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsTab({ settings }: SettingsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Language Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
                Ngôn ngữ
              </h3>
              <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                Chọn ngôn ngữ hiển thị
              </p>
            </div>
          </div>
          <select
            value={settings.language}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-['Inter'] text-base focus:border-[#0047AB] focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
            <Bell className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
          </div>
          <div>
            <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
              Thông báo
            </h3>
            <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
              Quản lý cài đặt thông báo
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <NotificationToggle
            title="Thông báo qua Email"
            description="Nhận thông báo về buổi phỏng vấn qua email"
            enabled={settings.notifications.emailNotifications}
          />
          <NotificationToggle
            title="Thông báo qua SMS"
            description="Nhận tin nhắn SMS nhắc nhở"
            enabled={settings.notifications.smsNotifications}
          />
          <NotificationToggle
            title="Thông báo đẩy"
            description="Nhận thông báo đẩy trên trình duyệt"
            enabled={settings.notifications.pushNotifications}
          />
          <NotificationToggle
            title="Email marketing"
            description="Nhận email về ưu đãi và tính năng mới"
            enabled={settings.notifications.marketingEmails}
          />
        </div>
      </div>
    </div>
  );
}
