import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import type { PaymentEntity, PaymentPurpose, TransactionEntity } from "@/interfaces";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { paymentManager } from "@/services/payment.manager";
import { transactionManager } from "@/services/transaction.manager";

type ActiveView = "transactions" | "payments";
type TransactionTypeFilter = "all" | "in" | "out";
type PaymentStatusFilter = "all" | "PENDING" | "COMPLETED" | "FAILED";
type PaymentPurposeFilter = "all" | PaymentPurpose;

const transactionTypeLabel = (value?: boolean) => {
  return value ? "Nạp vào" : "Rút ra";
};

const paymentStatusLabel = (value?: string) => {
  const normalized = value?.toUpperCase();
  if (normalized === "PENDING") return "Đang xử lý";
  if (normalized === "COMPLETED") return "Hoàn tất";
  if (normalized === "FAILED") return "Thất bại";
  return "-";
};

const paymentPurposeLabel = (value?: PaymentPurpose) => {
  switch (value) {
    case "BUY_MEMBERSHIP":
      return "Mua gói";
    case "TOP_UP_WALLET":
      return "Nạp ví";
    case "WITHDRAW_FROM_WALLET":
      return "Rút ví";
    case "MENTOR_INTERVIEW":
      return "Phỏng vấn mentor";
    default:
      return "-";
  }
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
  const [paymentPurposeFilter, setPaymentPurposeFilter] = useState<PaymentPurposeFilter>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [txResult, paymentResult] = await Promise.all([
      transactionManager.getAll(),
      paymentManager.getAll(),
    ]);

    if (!txResult.success || !paymentResult.success) {
      setError(
        txResult.error || paymentResult.error || "Không thể tải dữ liệu giao dịch và thanh toán."
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

      const purposeMatch =
        paymentPurposeFilter === "all" || tx.paymentPurpose === paymentPurposeFilter;

      return textMatch && typeMatch && purposeMatch;
    });
  }, [normalizedSearch, paymentPurposeFilter, transactionTypeFilter, transactions]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const textMatch =
        normalizedSearch.length === 0 ||
        (payment.transactionCode || "").toLowerCase().includes(normalizedSearch) ||
        (payment.description || "").toLowerCase().includes(normalizedSearch);

      const statusMatch =
        paymentStatusFilter === "all" || payment.status?.toUpperCase() === paymentStatusFilter;

      const purposeMatch =
        paymentPurposeFilter === "all" || payment.paymentPurpose === paymentPurposeFilter;

      return textMatch && statusMatch && purposeMatch;
    });
  }, [normalizedSearch, paymentPurposeFilter, paymentStatusFilter, payments]);

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
            Quản lý giao dịch và thanh toán
          </h1>
          <p className="mt-2 font-['Inter'] text-sm text-slate-600 dark:text-slate-400">
            Theo dõi và tra cứu giao dịch thanh toán trong hệ thống.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-['Inter'] text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          {loading ? <Spinner size="sm" tone="muted" /> : <RefreshCw className="h-4 w-4" />}
          Tải lại
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tổng giao dịch
          </p>
          <p className="mt-1 font-['Poppins'] text-2xl font-bold text-slate-800 dark:text-white">
            {visibleTransactionCount}
          </p>
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            / {transactionCount} bản ghi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tổng thanh toán
          </p>
          <p className="mt-1 font-['Poppins'] text-2xl font-bold text-slate-800 dark:text-white">
            {visiblePaymentCount}
          </p>
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            / {paymentCount} bản ghi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tổng tiền giao dịch
          </p>
          <p className="mt-1 font-['Poppins'] text-lg font-bold text-slate-800 dark:text-white">
            {formatCurrency(totalTransactionAmount)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-['Inter'] text-xs text-slate-500 dark:text-slate-400">
            Tổng tiền thanh toán
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
          Giao dịch
        </button>

        <button
          onClick={() => setActiveView("payments")}
          className={`rounded-lg px-4 py-2 font-['Inter'] text-sm font-semibold transition-colors ${
            activeView === "payments"
              ? "bg-[#0047AB] text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}>
          Thanh toán
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Tìm theo mã giao dịch hoặc mô tả"
          className="min-w-[280px] rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />

        {activeView === "transactions" ? (
          <select
            value={transactionTypeFilter}
            onChange={(event) =>
              setTransactionTypeFilter(event.target.value as TransactionTypeFilter)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Tất cả loại</option>
            <option value="in">Nạp vào</option>
            <option value="out">Rút ra</option>
          </select>
        ) : (
          <select
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value as PaymentStatusFilter)}
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="FAILED">Thất bại</option>
          </select>
        )}

        <select
          value={paymentPurposeFilter}
          onChange={(event) => setPaymentPurposeFilter(event.target.value as PaymentPurposeFilter)}
          className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <option value="all">Tất cả mục đích</option>
          <option value="BUY_MEMBERSHIP">Mua gói thành viên</option>
          <option value="TOP_UP_WALLET">Nạp ví</option>
          <option value="WITHDRAW_FROM_WALLET">Rút ví</option>
          <option value="MENTOR_INTERVIEW">Thanh toán phiên mentor</option>
        </select>
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
                    Mã giao dịch
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Loại
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Mục đích
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Ngày tạo
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
                      {paymentPurposeLabel(tx.paymentPurpose)}
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
                    Mã giao dịch
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Mục đích
                  </th>
                  <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                    Ngày tạo
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
                      {paymentStatusLabel(payment.status)}
                    </td>
                    <td className="px-4 py-3 font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
                      {paymentPurposeLabel(payment.paymentPurpose)}
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
            Không có giao dịch nào phù hợp với bộ lọc hiện tại.
          </div>
        )}

        {!loading && activeView === "payments" && filteredPayments.length === 0 && (
          <div className="px-4 py-8 text-center font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
            Không có thanh toán nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </div>
  );
}
