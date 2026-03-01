import { ArrowDownLeft, ArrowUpRight, Plus, Wallet as WalletIcon } from "lucide-react";

import {
  formatCurrency,
  formatDate,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from "@/lib/formatting";
import type { Transaction, Wallet } from "@/mocks/user.mock";

interface WalletTabProps {
  wallet: Wallet;
}

export function WalletTab({ wallet }: WalletTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Wallet Balance Card */}
      <div className="rounded-2xl bg-linear-to-r from-[#0047AB] to-[#007BFF] p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <WalletIcon className="h-8 w-8" />
          <span className="font-['Inter'] text-lg font-medium">Ví INBLUE</span>
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
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Lịch sử giao dịch
        </h3>
        <div className="flex flex-col gap-4">
          {wallet.transactions.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.type === "deposit"
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : transaction.type === "refund"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-rose-100 dark:bg-rose-900/30"
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
                  <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                      {formatDate(transaction.date)}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600">•</span>
                    <span className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
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
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                      : transaction.status === "pending"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                        : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
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
}
