import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
import { SpinnerBlock } from "@/components/ui/spinner";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import type { PaymentEntity, PaymentPurpose, TransactionEntity } from "@/interfaces";
import { formatCurrency, formatDateTime, toTimestamp } from "@/lib/formatting";
import { paymentManager } from "@/services/payment.manager";
import { transactionManager } from "@/services/transaction.manager";

type ActiveView = "transactions" | "payments";
type TransactionTypeFilter = "all" | "in" | "out";
type PaymentStatusFilter = "all" | "PENDING" | "COMPLETED" | "FAILED";
type PaymentPurposeFilter = "all" | PaymentPurpose;

type SortableTransaction = TransactionEntity & {
  idSortValue: number;
  transactionCodeSortValue: string;
  descriptionSortValue: string;
  amountSortValue: number;
  transactionTypeSortValue: number;
  paymentPurposeSortValue: string;
  createdAtSortValue: number;
};

type SortablePayment = PaymentEntity & {
  idSortValue: number;
  transactionCodeSortValue: string;
  descriptionSortValue: string;
  amountSortValue: number;
  statusSortValue: string;
  paymentPurposeSortValue: string;
  createdAtSortValue: number;
};

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");
  const [paymentPurposeFilter, setPaymentPurposeFilter] = useState<PaymentPurposeFilter>("all");
  const [transactionPageSize, setTransactionPageSize] = useHybridPageSize({
    key: "src_pages_admin_transactionpaymentmanagement_transactionpaymentmanagementpage_tsx_transactionpagesize",
    defaultPageSize: 10,
  });
  const [paymentPageSize, setPaymentPageSize] = useHybridPageSize({
    key: "src_pages_admin_transactionpaymentmanagement_transactionpaymentmanagementpage_tsx_paymentpagesize",
    defaultPageSize: 10,
  });

  const loadData = useCallback(async (showReloading = false) => {
    if (showReloading) {
      setIsReloading(true);
    } else {
      setIsInitialLoading(true);
    }

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
      if (showReloading) {
        setIsReloading(false);
      } else {
        setIsInitialLoading(false);
      }
      return;
    }

    setTransactions(txResult.data || []);
    setPayments(paymentResult.data || []);
    if (showReloading) {
      setIsReloading(false);
    } else {
      setIsInitialLoading(false);
    }
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

  const sortableTransactions = useMemo<SortableTransaction[]>(() => {
    return filteredTransactions.map((transaction) => ({
      ...transaction,
      idSortValue: typeof transaction.id === "number" ? transaction.id : 0,
      transactionCodeSortValue: (transaction.transactionCode || "").toLowerCase(),
      descriptionSortValue: (transaction.description || "").toLowerCase(),
      amountSortValue: transaction.amount || 0,
      transactionTypeSortValue: transaction.transactionType ? 1 : 0,
      paymentPurposeSortValue: transaction.paymentPurpose || "",
      createdAtSortValue: toTimestamp(transaction.createdAt) ?? 0,
    }));
  }, [filteredTransactions]);

  const sortablePayments = useMemo<SortablePayment[]>(() => {
    return filteredPayments.map((payment) => ({
      ...payment,
      idSortValue: typeof payment.id === "number" ? payment.id : 0,
      transactionCodeSortValue: (payment.transactionCode || "").toLowerCase(),
      descriptionSortValue: (payment.description || "").toLowerCase(),
      amountSortValue: payment.amount || 0,
      statusSortValue: (payment.status || "").toUpperCase(),
      paymentPurposeSortValue: payment.paymentPurpose || "",
      createdAtSortValue: toTimestamp(payment.createdAt) ?? 0,
    }));
  }, [filteredPayments]);

  const { sortedData: sortedTransactions, getSortProps: getTransactionSortProps } = useSortable(
    sortableTransactions,
    {
      defaultSort: {
        key: "createdAtSortValue",
        direction: "desc",
      },
      noSortBehavior: "preserve",
      tieBreaker: {
        key: "idSortValue",
        direction: "desc",
      },
    }
  );

  const { sortedData: sortedPayments, getSortProps: getPaymentSortProps } = useSortable(
    sortablePayments,
    {
      defaultSort: {
        key: "createdAtSortValue",
        direction: "desc",
      },
      noSortBehavior: "preserve",
      tieBreaker: {
        key: "idSortValue",
        direction: "desc",
      },
    }
  );

  const transactionPagination = usePagination({
    totalCount: sortedTransactions.length,
    pageSize: transactionPageSize,
  });

  const paymentPagination = usePagination({
    totalCount: sortedPayments.length,
    pageSize: paymentPageSize,
  });

  const transactionPageData = useMemo(
    () =>
      sortedTransactions.slice(
        transactionPagination.startIndex,
        transactionPagination.endIndex + 1
      ),
    [sortedTransactions, transactionPagination.startIndex, transactionPagination.endIndex]
  );

  const paymentPageData = useMemo(
    () => sortedPayments.slice(paymentPagination.startIndex, paymentPagination.endIndex + 1),
    [sortedPayments, paymentPagination.startIndex, paymentPagination.endIndex]
  );

  const visibleTransactionCount = sortedTransactions.length;
  const visiblePaymentCount = sortedPayments.length;

  const totalTransactionAmount = useMemo(
    () => filteredTransactions.reduce((acc, item) => acc + (item.amount || 0), 0),
    [filteredTransactions]
  );

  const totalPaymentAmount = useMemo(
    () => filteredPayments.reduce((acc, item) => acc + (item.amount || 0), 0),
    [filteredPayments]
  );

  const hasActiveFilters =
    searchKeyword.trim().length > 0 ||
    transactionTypeFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    paymentPurposeFilter !== "all";

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

        <ReloadButton
          onReload={() => loadData(true)}
          isLoading={isReloading}
          tooltip="Tải lại dữ liệu giao dịch và thanh toán"
          showLabel
          hideTooltip
        />
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
        <input
          value={searchKeyword}
          onChange={(event) => {
            setSearchKeyword(event.target.value);
            transactionPagination.goToFirstPage();
            paymentPagination.goToFirstPage();
          }}
          placeholder="Tìm theo mã giao dịch hoặc mô tả"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />

        {activeView === "transactions" ? (
          <select
            value={transactionTypeFilter}
            onChange={(event) => {
              setTransactionTypeFilter(event.target.value as TransactionTypeFilter);
              transactionPagination.goToFirstPage();
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Tất cả loại</option>
            <option value="in">Nạp vào</option>
            <option value="out">Rút ra</option>
          </select>
        ) : (
          <select
            value={paymentStatusFilter}
            onChange={(event) => {
              setPaymentStatusFilter(event.target.value as PaymentStatusFilter);
              paymentPagination.goToFirstPage();
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="FAILED">Thất bại</option>
          </select>
        )}

        <select
          value={paymentPurposeFilter}
          onChange={(event) => {
            setPaymentPurposeFilter(event.target.value as PaymentPurposeFilter);
            transactionPagination.goToFirstPage();
            paymentPagination.goToFirstPage();
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <option value="all">Tất cả mục đích</option>
          <option value="BUY_MEMBERSHIP">Mua gói thành viên</option>
          <option value="TOP_UP_WALLET">Nạp ví</option>
          <option value="WITHDRAW_FROM_WALLET">Rút ví</option>
          <option value="MENTOR_INTERVIEW">Thanh toán phiên mentor</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchKeyword("");
              setTransactionTypeFilter("all");
              setPaymentStatusFilter("all");
              setPaymentPurposeFilter("all");
              transactionPagination.goToFirstPage();
              paymentPagination.goToFirstPage();
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 font-['Inter'] text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 font-['Inter'] text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        {isInitialLoading ? (
          <SpinnerBlock size="lg" label="Đang tải dữ liệu giao dịch và thanh toán..." />
        ) : (
          <>
            {activeView === "transactions" ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getTransactionSortProps("transactionCodeSortValue")}>
                          Mã giao dịch
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getTransactionSortProps("descriptionSortValue")}>
                          Mô tả
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getTransactionSortProps("amountSortValue")}>
                          Số tiền
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getTransactionSortProps("transactionTypeSortValue")}>
                          Loại
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getTransactionSortProps("paymentPurposeSortValue")}>
                          Mục đích
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getTransactionSortProps("createdAtSortValue")}>
                          Ngày tạo
                        </SortButton>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                    {transactionPageData.map((tx) => (
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

                {sortedTransactions.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800">
                    <PaginationControl
                      pagination={transactionPagination}
                      onPageSizeChange={(nextPageSize) => {
                        setTransactionPageSize(nextPageSize);
                        transactionPagination.goToFirstPage();
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getPaymentSortProps("transactionCodeSortValue")}>
                          Mã giao dịch
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getPaymentSortProps("descriptionSortValue")}>
                          Mô tả
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getPaymentSortProps("amountSortValue")}>Số tiền</SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getPaymentSortProps("statusSortValue")}>
                          Trạng thái
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getPaymentSortProps("paymentPurposeSortValue")}>
                          Mục đích
                        </SortButton>
                      </th>
                      <th className="px-4 py-3 text-left font-['Inter'] text-xs font-semibold text-slate-600 uppercase dark:text-slate-300">
                        <SortButton {...getPaymentSortProps("createdAtSortValue")}>
                          Ngày tạo
                        </SortButton>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                    {paymentPageData.map((payment) => (
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

                {sortedPayments.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800">
                    <PaginationControl
                      pagination={paymentPagination}
                      onPageSizeChange={(nextPageSize) => {
                        setPaymentPageSize(nextPageSize);
                        paymentPagination.goToFirstPage();
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeView === "transactions" && transactionPageData.length === 0 && (
              <div className="px-4 py-8 text-center font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                Không có giao dịch nào phù hợp với bộ lọc hiện tại.
              </div>
            )}

            {activeView === "payments" && paymentPageData.length === 0 && (
              <div className="px-4 py-8 text-center font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                Không có thanh toán nào phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
