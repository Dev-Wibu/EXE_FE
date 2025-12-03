import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Camera,
  ChevronRight,
  Globe,
  Lock,
  Mail,
  Phone,
  Plus,
  User,
  Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";

import {
  formatCurrency,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from "@/mocks/payment.mock";
import {
  fetchUserProfile,
  fetchUserSettings,
  fetchWallet,
  mockUserProfile,
  mockUserSettings,
  mockWallet,
  type Transaction,
  type UserProfile,
  type UserSettings,
  type Wallet,
} from "@/mocks/user.mock";

export function AccountPage() {
  const [userProfile] = useState<UserProfile>(mockUserProfile);
  const [wallet] = useState<Wallet>(mockWallet);
  const [settings] = useState<UserSettings>(mockUserSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "wallet" | "settings">("profile");

  // Simulate loading state
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUserProfile(), fetchWallet(), fetchUserSettings()]);
    setIsLoading(false);
  };

  // Format date to Vietnamese format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "wallet":
        return renderWalletTab();
      case "settings":
        return renderSettingsTab();
      default:
        return renderProfileTab();
    }
  };

  const renderProfileTab = () => (
    <div className="flex flex-col gap-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-100">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.fullName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-indigo-500" />
            )}
          </div>
          <button className="absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white hover:bg-violet-600">
            <Camera className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-['Inter'] text-2xl font-bold text-zinc-800">
            {userProfile.fullName}
          </h2>
          <p className="font-['Inter'] text-base font-normal text-gray-500">
            Thành viên từ {formatDate(userProfile.createdAt)}
          </p>
        </div>
      </div>

      {/* User Info Section */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-['Inter'] text-xl font-semibold text-zinc-800">Thông tin cá nhân</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="font-['Inter'] text-base font-medium text-violet-500 hover:text-violet-600">
            {isEditing ? "Hủy" : "Chỉnh sửa"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <User className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex-1">
              <p className="font-['Inter'] text-sm font-normal text-gray-500">Họ và tên</p>
              {isEditing ? (
                <input
                  type="text"
                  defaultValue={userProfile.fullName}
                  className="w-full rounded border border-gray-300 px-2 py-1 font-['Inter'] text-base focus:border-violet-500 focus:outline-none"
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800">
                  {userProfile.fullName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-['Inter'] text-sm font-normal text-gray-500">Email</p>
              <p className="font-['Inter'] text-base font-medium text-zinc-800">
                {userProfile.email}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Phone className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-['Inter'] text-sm font-normal text-gray-500">Số điện thoại</p>
              {isEditing ? (
                <input
                  type="tel"
                  defaultValue={userProfile.phone}
                  className="w-full rounded border border-gray-300 px-2 py-1 font-['Inter'] text-base focus:border-violet-500 focus:outline-none"
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800">
                  {userProfile.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-['Inter'] text-base font-medium text-gray-700 hover:bg-gray-50">
              Hủy
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                handleRefreshData();
              }}
              className="rounded-lg bg-violet-500 px-6 py-2 font-['Inter'] text-base font-medium text-white hover:bg-violet-600">
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800">Đổi mật khẩu</h3>
              <p className="font-['Inter'] text-sm font-normal text-gray-500">
                Đổi mật khẩu để bảo mật tài khoản
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 font-['Inter'] text-base font-medium text-violet-500 hover:text-violet-600">
            Thay đổi
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderWalletTab = () => (
    <div className="flex flex-col gap-6">
      {/* Wallet Balance Card */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <WalletIcon className="h-8 w-8" />
          <span className="font-['Inter'] text-lg font-medium">Ví INTELITE</span>
        </div>
        <div className="mb-6">
          <p className="font-['Inter'] text-sm font-normal opacity-80">Số dư hiện tại</p>
          <p className="font-['Poppins'] text-4xl font-bold">{formatCurrency(wallet.balance)}</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white/20 px-6 py-3 font-['Inter'] text-base font-medium backdrop-blur-sm hover:bg-white/30">
          <Plus className="h-5 w-5" />
          Nạp tiền
        </button>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800">
          Lịch sử giao dịch
        </h3>
        <div className="flex flex-col gap-4">
          {wallet.transactions.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.type === "deposit"
                      ? "bg-emerald-100"
                      : transaction.type === "refund"
                        ? "bg-blue-100"
                        : "bg-rose-100"
                  }`}>
                  {transaction.type === "deposit" || transaction.type === "refund" ? (
                    <ArrowDownLeft
                      className={`h-5 w-5 ${
                        transaction.type === "deposit" ? "text-emerald-500" : "text-blue-500"
                      }`}
                    />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <div>
                  <p className="font-['Inter'] text-base font-medium text-zinc-800">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter'] text-sm font-normal text-gray-500">
                      {formatDate(transaction.date)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="font-['Inter'] text-sm font-normal text-gray-500">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-['Inter'] text-lg font-semibold ${
                    transaction.amount > 0 ? "text-emerald-500" : "text-rose-500"
                  }`}>
                  {transaction.amount > 0 ? "+" : ""}
                  {new Intl.NumberFormat("vi-VN").format(transaction.amount)} đ
                </p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 font-['Inter'] text-xs font-medium ${
                    transaction.status === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : transaction.status === "pending"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-rose-100 text-rose-600"
                  }`}>
                  {getTransactionStatusLabel(transaction.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="flex flex-col gap-6">
      {/* Language Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800">Ngôn ngữ</h3>
              <p className="font-['Inter'] text-sm font-normal text-gray-500">
                Chọn ngôn ngữ hiển thị
              </p>
            </div>
          </div>
          <select
            value={settings.language}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-['Inter'] text-base focus:border-violet-500 focus:outline-none">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
            <Bell className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800">Thông báo</h3>
            <p className="font-['Inter'] text-sm font-normal text-gray-500">
              Quản lý cài đặt thông báo
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {renderNotificationToggle(
            "Thông báo qua Email",
            "Nhận thông báo về buổi phỏng vấn qua email",
            settings.notifications.emailNotifications
          )}
          {renderNotificationToggle(
            "Thông báo qua SMS",
            "Nhận tin nhắn SMS nhắc nhở",
            settings.notifications.smsNotifications
          )}
          {renderNotificationToggle(
            "Thông báo đẩy",
            "Nhận thông báo đẩy trên trình duyệt",
            settings.notifications.pushNotifications
          )}
          {renderNotificationToggle(
            "Email marketing",
            "Nhận email về ưu đãi và tính năng mới",
            settings.notifications.marketingEmails
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationToggle = (title: string, description: string, enabled: boolean) => (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
      <div>
        <p className="font-['Inter'] text-base font-medium text-zinc-800">{title}</p>
        <p className="font-['Inter'] text-sm font-normal text-gray-500">{description}</p>
      </div>
      <button
        className={`relative h-7 w-12 rounded-full transition-colors ${
          enabled ? "bg-violet-500" : "bg-gray-300"
        }`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Banner */}
      <div className="flex h-56 items-center justify-between rounded-[30px] bg-indigo-100 px-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-['Open_Sans'] text-3xl leading-tight font-bold text-blue-800">
            Tài khoản của bạn
          </h1>
          <p className="font-['Open_Sans'] text-base font-normal text-gray-700">
            Quản lý thông tin cá nhân, ví tiền và cài đặt
          </p>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/50">
          <User className="h-12 w-12 text-indigo-500" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "profile"
              ? "border-b-2 border-violet-500 text-violet-500"
              : "text-gray-500 hover:text-gray-700"
          }`}>
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "wallet"
              ? "border-b-2 border-violet-500 text-violet-500"
              : "text-gray-500 hover:text-gray-700"
          }`}>
          Ví tiền
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "settings"
              ? "border-b-2 border-violet-500 text-violet-500"
              : "text-gray-500 hover:text-gray-700"
          }`}>
          Cài đặt
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="font-['Inter'] text-base text-gray-500">Đang tải...</p>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
}
