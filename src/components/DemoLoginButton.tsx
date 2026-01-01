/**
 * Demo Login Button Component
 *
 * This component displays mock account credentials for testing purposes.
 * When the user clicks the button, it shows a popup with demo user and admin accounts.
 *
 * TO REMOVE THIS COMPONENT:
 * 1. Delete this file (src/components/DemoLoginButton.tsx)
 * 2. Remove the import and usage from LoginPage.tsx
 *
 * The component is self-contained in a single file for easy removal.
 */

import { useState } from "react";

interface DemoAccount {
  role: string;
  email: string;
  password: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "USER",
    email: "user@example.com",
    password: "user123",
    description: "Tài khoản người dùng thông thường để trải nghiệm các tính năng cơ bản",
  },
  {
    role: "ADMIN",
    email: "admin@example.com",
    password: "admin123",
    description: "Tài khoản quản trị viên để truy cập trang quản lý",
  },
];

interface DemoLoginButtonProps {
  onSelectAccount?: (email: string, password: string) => void;
}

export function DemoLoginButton({ onSelectAccount }: DemoLoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.log("Failed to copy to clipboard");
    }
  };

  const handleSelectAccount = (account: DemoAccount) => {
    if (onSelectAccount) {
      onSelectAccount(account.email, account.password);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Demo Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[15px] border-2 border-dashed border-orange-400 bg-orange-50 font-['Markazi_Text'] text-xl font-medium text-orange-600 transition-all hover:border-orange-500 hover:bg-orange-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        Xem tài khoản demo để thử nghiệm
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-['Markazi_Text'] text-3xl font-semibold text-indigo-600">
                Tài khoản Demo
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Notice */}
            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <p>
                <strong>Lưu ý:</strong> Đây là tài khoản ảo dùng để thử nghiệm chức năng. Click vào
                tài khoản để tự động điền thông tin đăng nhập.
              </p>
            </div>

            {/* Account Cards */}
            <div className="space-y-4">
              {DEMO_ACCOUNTS.map((account, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-xl border border-gray-200 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => handleSelectAccount(account)}
                >
                  {/* Role Badge */}
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        account.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {account.role}
                    </span>
                  </div>

                  {/* Credentials */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Email:</span>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">
                          {account.email}
                        </code>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(account.email, `email-${index}`);
                          }}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                          title="Copy email"
                        >
                          {copiedField === `email-${index}` ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-green-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Mật khẩu:</span>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">
                          {account.password}
                        </code>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(account.password, `password-${index}`);
                          }}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                          title="Copy password"
                        >
                          {copiedField === `password-${index}` ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-green-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-xs text-gray-500">{account.description}</p>

                  {/* Click hint */}
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-indigo-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.414 1.415l.708-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Click để tự động điền
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-center text-xs text-gray-400">
                Nút này chỉ dùng cho mục đích phát triển và sẽ được xóa khi có tài khoản thật.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
