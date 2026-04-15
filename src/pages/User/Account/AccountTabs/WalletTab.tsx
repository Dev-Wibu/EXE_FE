import { AlertCircle, ArrowDownLeft, ArrowUpRight, Plus, Wallet as WalletIcon } from "lucide-react";

import {
  formatCurrency,
  formatDate,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from "@/lib/formatting";
import type { Transaction, Wallet } from "@/mocks/user.mock";

interface WalletTabProps {
  wallet: Wallet;
  isLoading: boolean;
  isTopUpLoading: boolean;
  topUpAmount: string;
  minTopUp: number;
  maxTopUp: number;
  step: number;
  presetAmounts: number[];
  onTopUpAmountChange: (_value: string) => void;
  onTopUp: (_amount: number) => void;
}

export function WalletTab({
  wallet,
  isLoading,
  isTopUpLoading,
  topUpAmount,
  minTopUp,
  maxTopUp,
  step,
  presetAmounts,
  onTopUpAmountChange,
  onTopUp,
}: WalletTabProps) {
  const amountValue = Number(topUpAmount || 0);
  const isAmountValid =
    Number.isFinite(amountValue) &&
    amountValue >= minTopUp &&
    amountValue <= maxTopUp &&
    amountValue % step === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-linear-to-r from-[#0047AB] to-[#007BFF] p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <WalletIcon className="h-8 w-8" />
          <span className="font-['Inter'] text-lg font-medium">Ví INBLUE</span>
        </div>
        <div className="mb-6">
          <p className="font-['Inter'] text-sm font-normal opacity-80">Số dư hiện tại</p>
          <p className="font-['Poppins'] text-4xl font-bold">{formatCurrency(wallet.balance)}</p>
        </div>

        <div className="space-y-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          <p className="font-['Inter'] text-sm font-medium">Nạp tiền vào ví</p>

          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => onTopUpAmountChange(String(preset))}
                disabled={isTopUpLoading}
                className={`rounded-lg px-3 py-1.5 font-['Inter'] text-xs font-medium transition-colors ${
                  Number(topUpAmount) === preset
                    ? "bg-white text-[#0047AB]"
                    : "bg-white/20 text-white hover:bg-white/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}>
                {preset.toLocaleString("vi-VN")}đ
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              inputMode="numeric"
              value={topUpAmount}
              onChange={(event) => onTopUpAmountChange(event.target.value)}
              placeholder="Nhập số tiền muốn nạp"
              className="h-11 flex-1 rounded-lg border border-white/30 bg-white/15 px-3 font-['Inter'] text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-hidden"
            />
            <button
              onClick={() => onTopUp(amountValue)}
              disabled={!isAmountValid || isTopUpLoading}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 font-['Inter'] text-sm font-semibold text-[#0047AB] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {isTopUpLoading ? "Đang tạo link..." : "Nạp tiền"}
            </button>
          </div>

          <p className="font-['Inter'] text-xs text-white/80">
            Số tiền hợp lệ: {minTopUp.toLocaleString("vi-VN")}đ - {maxTopUp.toLocaleString("vi-VN")}
            đ, bước nhảy {step.toLocaleString("vi-VN")}đ.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Lịch sử giao dịch
        </h3>

        {isLoading ? (
          <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
            Đang tải lịch sử giao dịch...
          </p>
        ) : wallet.transactions.length === 0 ? (
          <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
            Chưa có giao dịch nào.
          </p>
        ) : (
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
                          ? "bg-rose-100 dark:bg-rose-900/30"
                          : transaction.type === "unknown"
                            ? "bg-slate-100 dark:bg-slate-700/50"
                            : "bg-rose-100 dark:bg-rose-900/30"
                    }`}>
                    {transaction.type === "deposit" ? (
                      <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                    ) : transaction.type === "refund" ? (
                      <ArrowUpRight className="h-5 w-5 text-rose-500" />
                    ) : transaction.type === "unknown" ? (
                      <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-300" />
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
        )}
      </div>
    </div>
  );
}
