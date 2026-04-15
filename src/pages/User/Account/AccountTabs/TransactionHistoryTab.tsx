import { AlertCircle, ArrowDownLeft, ArrowUpRight, Hash } from "lucide-react";

import type { TransactionEntity } from "@/interfaces";
import {
  formatCurrency,
  formatDateTime,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from "@/lib/formatting";

import { mapTransactionToAccountTransaction } from "../wallet-mapping";

interface TransactionHistoryTabProps {
  transactions: TransactionEntity[];
  isLoading: boolean;
}

const TransactionTypeIcon = ({ type }: { type: "deposit" | "payment" | "refund" | "unknown" }) => {
  if (type === "deposit") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  if (type === "unknown") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/40">
        <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
      <ArrowUpRight className="h-5 w-5 text-rose-600 dark:text-rose-400" />
    </div>
  );
};

export function TransactionHistoryTab({ transactions, isLoading }: TransactionHistoryTabProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
      <div className="mb-5">
        <h3 className="font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Lịch sử giao dịch
        </h3>
        <p className="mt-1 font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
          Theo dõi toàn bộ giao dịch thanh toán, ví và phiên phỏng vấn của tài khoản.
        </p>
      </div>

      {isLoading ? (
        <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
          Đang tải lịch sử giao dịch...
        </p>
      ) : transactions.length === 0 ? (
        <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
          Chưa có giao dịch nào.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {transactions.map((transaction) => {
            const item = mapTransactionToAccountTransaction(transaction);
            return (
              <div
                key={`${item.id}-${item.transactionCode}-${item.date}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/70">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <TransactionTypeIcon type={item.type} />
                    <div className="space-y-1">
                      <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDateTime(item.date)}</span>
                        <span>•</span>
                        <span>{getTransactionTypeLabel(item.type)}</span>
                        <span>•</span>
                        <span>{item.purposeLabel}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 dark:bg-slate-900/60">
                          <Hash className="h-3 w-3" />
                          {item.transactionCode}
                        </span>
                        {typeof item.currentBalance === "number" && (
                          <span className="rounded-md bg-white px-2 py-1 dark:bg-slate-900/60">
                            Số dư sau GD: {formatCurrency(item.currentBalance)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p
                      className={`font-['Inter'] text-lg font-semibold ${
                        item.amount >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}>
                      {item.amount >= 0 ? "+" : ""}
                      {new Intl.NumberFormat("vi-VN").format(item.amount)} đ
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-1 font-['Inter'] text-xs font-medium ${
                        item.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                      {getTransactionStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
