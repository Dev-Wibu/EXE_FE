import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PaymentEntity, TransactionEntity } from "@/interfaces";
import { buildSupportPayload, formatSupportPayload } from "@/lib";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { paymentManager } from "@/services/payment.manager";
import { transactionManager } from "@/services/transaction.manager";
import { toast } from "sonner";

type ActiveView = "transactions" | "payments";
type TransactionTypeFilter = "all" | "in" | "out";
type PaymentStatusFilter = "all" | "PENDING" | "COMPLETED" | "FAILED";

const transactionTypeLabel = (value?: boolean) => {
  return value ? "Transfer In" : "Transfer Out";
};

export function TransactionPaymentManagementPage() {
  const [activeView, setActiveView] = useState<ActiveView>("transactions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");
  const [isCopyingSupportPayload, setIsCopyingSupportPayload] = useState(false);

  const handleCopySupportPayload = useCallback(async () => {
    if (isCopyingSupportPayload) {
      return;
    }

    const targetOrderCode = searchKeyword.trim();
    if (!targetOrderCode) {
      toast.info("Nhap orderCode vao o tim kiem de tao payload ho tro.");
      return;
    }

    setIsCopyingSupportPayload(true);
    try {
      const payload = buildSupportPayload({
        orderCode: targetOrderCode,
        extra: {
          scope: "admin-transaction-payment-management",
          activeView,
        },
      });

      await navigator.clipboard.writeText(formatSupportPayload(payload));
      toast.success("Da sao chep payload ho tro theo orderCode.");
    } catch {
      toast.error("Khong the sao chep payload ho tro.");
    } finally {
      setIsCopyingSupportPayload(false);
    }
  }, [activeView, isCopyingSupportPayload, searchKeyword]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [txResult, paymentResult] = await Promise.all([
      transactionManager.getAll(),
      paymentManager.getAll(),
    ]);

    if (!txResult.success || !paymentResult.success) {
      setError(
        txResult.error || paymentResult.error || "Khong the tai du lieu transaction/payment."
      );
      setTransactions(txResult.data || []);
      setPayments(paymentResult.data || []);
      setLoading(false);
      return;
    }

    setTransactions(txResult.data || []);
    setPayments(paymentResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  const transactionCount = transactions.length;
  const paymentCount = payments.length;

  const normalizedSearch = searchKeyword.trim().toLowerCase();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const textMatch =
        normalizedSearch.length === 0 ||
        (tx.transactionCode || "").toLowerCase().includes(normalizedSearch) ||
        (tx.description || "").toLowerCase().includes(normalizedSearch);

      const typeMatch =
        transactionTypeFilter === "all" ||
        (transactionTypeFilter === "in" && tx.transactionType === true) ||
        (transactionTypeFilter === "out" && tx.transactionType === false);

      return textMatch && typeMatch;
    });
  }, [normalizedSearch, transactionTypeFilter, transactions]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const textMatch =
        normalizedSearch.length === 0 ||
        (payment.transactionCode || "").toLowerCase().includes(normalizedSearch) ||
        (payment.description || "").toLowerCase().includes(normalizedSearch);

      const statusMatch =
        paymentStatusFilter === "all" || payment.status?.toUpperCase() === paymentStatusFilter;

      return textMatch && statusMatch;
    });
  }, [normalizedSearch, paymentStatusFilter, payments]);

  const visibleTransactionCount = filteredTransactions.length;
  const visiblePaymentCount = filteredPayments.length;

  const totalTransactionAmount = useMemo(
    () => filteredTransactions.reduce((acc, item) => acc + (item.amount || 0), 0),
    [filteredTransactions]
  );

  const totalPaymentAmount = useMemo(
    () => filteredPayments.reduce((acc, item) => acc + (item.amount || 0), 0),
    [filteredPayments]
  );

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
            Transaction va Payment Management
          </h1>
          <p className="mt-2 font-['Inter'] text-sm text-slate-600 dark:text-slate-400">
            Khung quan tri cho ADMIN/STAFF. Du lieu tai truc tiep tu API cho transaction/payment.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-['Inter'] text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tai lai
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tong giao dich
          </p>
          <p className="mt-1 font-['Poppins'] text-2xl font-bold text-slate-800 dark:text-white">
            {visibleTransactionCount}
          </p>
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            / {transactionCount} ban ghi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tong thanh toan
          </p>
          <p className="mt-1 font-['Poppins'] text-2xl font-bold text-slate-800 dark:text-white">
            {visiblePaymentCount}
          </p>
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            / {paymentCount} ban ghi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tong so tien giao dich
          </p>
          <p className="mt-1 font-['Poppins'] text-lg font-bold text-slate-800 dark:text-white">
            {formatCurrency(totalTransactionAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tong so tien thanh toan
          </p>
          <p className="mt-1 font-['Poppins'] text-lg font-bold text-slate-800 dark:text-white">
            {formatCurrency(totalPaymentAmount)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setActiveView("transactions")}
          className={`rounded-lg px-4 py-2 font-['Inter'] text-sm font-semibold transition-colors ${
            activeView === "transactions"
              ? "bg-[#0047AB] text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}>
          Transactions
        </button>

        <button
          onClick={() => setActiveView("payments")}
          className={`rounded-lg px-4 py-2 font-['Inter'] text-sm font-semibold transition-colors ${
            activeView === "payments"
              ? "bg-[#0047AB] text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}>
          Payments
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Tim theo transaction code hoac description"
          className="min-w-[280px] rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />

        {activeView === "transactions" ? (
          <select
            value={transactionTypeFilter}
            onChange={(event) =>
              setTransactionTypeFilter(event.target.value as TransactionTypeFilter)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Tat ca type</option>
            <option value="in">Transfer In</option>
            <option value="out">Transfer Out</option>
          </select>
        ) : (
          <select
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value as PaymentStatusFilter)}
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Tat ca status</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        )}

        <button
          onClick={() => void handleCopySupportPayload()}
          disabled={isCopyingSupportPayload}
          className="rounded-lg border border-blue-300 px-3 py-2 font-['Inter'] text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20">
          {isCopyingSupportPayload ? "Dang sao chep..." : "Sao chep payload ho tro"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 font-['Inter'] text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        {activeView === "transactions" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    CreatedAt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {filteredTransactions.map((tx) => (
                  <tr key={`${tx.transactionCode}-${tx.id}`}>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {tx.transactionCode || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {tx.description || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {formatCurrency(tx.amount || 0)}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {transactionTypeLabel(tx.transactionType)}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {formatDateTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    CreatedAt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {filteredPayments.map((payment) => (
                  <tr key={`${payment.transactionCode}-${payment.id}`}>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {payment.transactionCode || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {payment.description || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {formatCurrency(payment.amount || 0)}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {payment.status || "-"}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {formatDateTime(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeView === "transactions" && filteredTransactions.length === 0 && (
          <div className="px-4 py-8 text-center font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
            Khong co transaction nao phu hop bo loc hien tai.
          </div>
        )}

        {!loading && activeView === "payments" && filteredPayments.length === 0 && (
          <div className="px-4 py-8 text-center font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
            Khong co payment nao phu hop bo loc hien tai.
          </div>
        )}
      </div>
    </div>
  );
}
