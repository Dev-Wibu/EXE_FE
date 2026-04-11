import { useQuery } from "@tanstack/react-query";
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Activity,
  Calendar as CalendarIcon,
  CreditCard,
  DollarSign,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PaymentEntity, TransactionEntity } from "@/interfaces";
import { formatCurrency } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { dashboardAdminManager } from "@/services";

type TrendPoint = {
  key: string;
  date: string;
  amount: number;
};

type RangeMode = "7" | "14" | "30" | "custom";

type RecentRecord =
  | (PaymentEntity & { source: "INCOME" })
  | (TransactionEntity & { source: "WALLET" });

const DEFAULT_RANGE_DAYS = 30;

const RANGE_OPTIONS: Array<{ label: string; value: Exclude<RangeMode, "custom"> }> = [
  { label: "7 ngày", value: "7" },
  { label: "14 ngày", value: "14" },
  { label: "30 ngày", value: "30" },
];

const isSuccessPayment = (status?: PaymentEntity["status"]) => {
  if (!status) return true;
  const normalized = status.toUpperCase();
  return normalized === "COMPLETED" || normalized === "SUCCESS" || normalized === "PAID";
};

const toMillis = (value?: string) => {
  if (!value) return 0;
  const normalizedValue =
    value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isWithinDateRange = (value: string | undefined, from: Date, to: Date) => {
  const timestamp = toMillis(value);
  if (!timestamp) return false;
  return timestamp >= from.getTime() && timestamp <= to.getTime();
};

const buildTrendData = (
  records: Array<{ createdAt?: string; amount?: number }>,
  from: Date,
  to: Date
) => {
  const pointMap: Record<string, TrendPoint> = {};
  const points: TrendPoint[] = [];

  for (let cursor = new Date(from); cursor <= to; cursor = addDays(cursor, 1)) {
    const dateKey = format(cursor, "yyyy-MM-dd");
    const point = {
      key: dateKey,
      date: format(cursor, "dd/MM"),
      amount: 0,
    };
    pointMap[dateKey] = point;
    points.push(point);
  }

  records.forEach((record) => {
    if (!record.createdAt) return;
    const timestamp = toMillis(record.createdAt);
    if (!timestamp) return;

    const dateKey = format(new Date(timestamp), "yyyy-MM-dd");
    if (pointMap[dateKey]) {
      pointMap[dateKey].amount += record.amount || 0;
    }
  });

  return points;
};

const getPaymentStatusLabel = (status?: PaymentEntity["status"]) => {
  switch (status) {
    case "COMPLETED":
      return "Thành công";
    case "PENDING":
      return "Đang xử lý";
    case "FAILED":
      return "Thất bại";
    default:
      return "Hoàn tất";
  }
};

const formatTransactionTime = (value?: string) => {
  const timestamp = toMillis(value);
  if (!timestamp) return "Không có thời gian";
  return format(new Date(timestamp), "HH:mm, dd/MM", { locale: vi });
};

export function DashboardOverviewPage() {
  const { data: userCount, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin", "total-users"],
    queryFn: () => dashboardAdminManager.getTotalUsers(),
  });

  const { data: mentorCount, isLoading: loadingMentors } = useQuery({
    queryKey: ["admin", "total-mentors"],
    queryFn: () => dashboardAdminManager.getTotalMentors(),
  });

  const { data: incomeResponse, isLoading: loadingIncome } = useQuery({
    queryKey: ["admin", "total-income"],
    queryFn: () => dashboardAdminManager.getTotalIncome(),
  });

  const { data: transactionResponse, isLoading: loadingTransactions } = useQuery({
    queryKey: ["admin", "total-transactions"],
    queryFn: () => dashboardAdminManager.getTotalTransactions(),
  });

  const { data: usageResponse } = useQuery({
    queryKey: ["admin", "feature-usage-logs"],
    queryFn: () => dashboardAdminManager.getFeatureUsageLogs(),
  });

  const [rangeMode, setRangeMode] = useState<RangeMode>("30");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  const handleCustomFromChange = (date: Date | undefined) => {
    setCustomFrom(date);
    if (date && customTo && date > customTo) {
      setCustomTo(undefined);
    }
  };

  const handleCustomToChange = (date: Date | undefined) => {
    setCustomTo(date);
    if (date && customFrom && date < customFrom) {
      setCustomFrom(undefined);
    }
  };

  const effectiveRange = useMemo(() => {
    if (rangeMode === "custom" && customFrom && customTo && customFrom <= customTo) {
      return {
        from: startOfDay(customFrom),
        to: endOfDay(customTo),
      };
    }

    const days = rangeMode === "custom" ? DEFAULT_RANGE_DAYS : Number(rangeMode);
    return {
      from: startOfDay(subDays(new Date(), days - 1)),
      to: endOfDay(new Date()),
    };
  }, [customFrom, customTo, rangeMode]);

  const rangeLabel = useMemo(() => {
    if (rangeMode === "custom" && customFrom && customTo && customFrom <= customTo) {
      return `${format(customFrom, "dd/MM/yyyy")} - ${format(customTo, "dd/MM/yyyy")}`;
    }

    const days = rangeMode === "custom" ? DEFAULT_RANGE_DAYS : Number(rangeMode);
    return `${days} ngày gần nhất`;
  }, [customFrom, customTo, rangeMode]);

  const rangeDays = useMemo(() => {
    const diff = effectiveRange.to.getTime() - effectiveRange.from.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  }, [effectiveRange]);

  const incomeRecords = useMemo(() => incomeResponse?.data ?? [], [incomeResponse?.data]);
  const walletRecords = useMemo(() => transactionResponse?.data ?? [], [transactionResponse?.data]);
  const usageLogs = useMemo(() => usageResponse?.data ?? [], [usageResponse?.data]);

  const filteredIncomeRecords = useMemo(
    () =>
      incomeRecords.filter((record) =>
        isWithinDateRange(record.createdAt, effectiveRange.from, effectiveRange.to)
      ),
    [effectiveRange, incomeRecords]
  );

  const filteredWalletRecords = useMemo(
    () =>
      walletRecords.filter((record) =>
        isWithinDateRange(record.createdAt, effectiveRange.from, effectiveRange.to)
      ),
    [effectiveRange, walletRecords]
  );

  const filteredUsageLogs = useMemo(
    () =>
      usageLogs.filter((log) =>
        isWithinDateRange(log.useAt, effectiveRange.from, effectiveRange.to)
      ),
    [effectiveRange, usageLogs]
  );

  const stats = useMemo(() => {
    const directRevenue = filteredIncomeRecords
      .filter((payment) => isSuccessPayment(payment.status))
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const walletDeposits = filteredWalletRecords.reduce(
      (sum, record) => sum + (record.amount || 0),
      0
    );

    return {
      directRevenue,
      walletDeposits,
    };
  }, [filteredIncomeRecords, filteredWalletRecords]);

  const incomeTrendData = useMemo(() => {
    const successfulIncome = filteredIncomeRecords.filter((payment) =>
      isSuccessPayment(payment.status)
    );
    return buildTrendData(successfulIncome, effectiveRange.from, effectiveRange.to);
  }, [effectiveRange, filteredIncomeRecords]);

  const walletTrendData = useMemo(
    () => buildTrendData(filteredWalletRecords, effectiveRange.from, effectiveRange.to),
    [effectiveRange, filteredWalletRecords]
  );

  const usageChartData = useMemo(() => {
    const counts: Record<string, number> = {
      MENTOR_INTERVIEW: 0,
      AI_INTERVIEW: 0,
      PRACTICE: 0,
      QUIZ: 0,
    };

    filteredUsageLogs.forEach((log) => {
      if (counts[log.featureName] !== undefined) {
        counts[log.featureName] += 1;
      }
    });

    const labelMap: Record<string, string> = {
      MENTOR_INTERVIEW: "Phỏng vấn Mentor",
      AI_INTERVIEW: "Phỏng vấn AI",
      PRACTICE: "Luyện tập",
      QUIZ: "Làm kiểm tra",
    };

    const colorMap: Record<string, string> = {
      MENTOR_INTERVIEW: "#8b5cf6", // violet-500
      AI_INTERVIEW: "#0ea5e9", // sky-500
      PRACTICE: "#10b981", // emerald-500
      QUIZ: "#f59e0b", // amber-500
    };

    return Object.entries(counts).map(([key, value]) => ({
      name: labelMap[key] || key,
      value,
      color: colorMap[key] || "#94a3b8",
    }));
  }, [filteredUsageLogs]);

  const overviewStats = [
    {
      title: "Tổng người dùng",
      value: loadingUsers ? "..." : (userCount?.data || 0).toLocaleString("vi-VN"),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Mentor",
      value: loadingMentors ? "..." : (mentorCount?.data || 0).toLocaleString("vi-VN"),
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Doanh thu trực tiếp",
      value: loadingIncome ? "..." : formatCurrency(stats.directRevenue),
      icon: DollarSign,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      title: "Tổng nạp ví",
      value: loadingTransactions ? "..." : formatCurrency(stats.walletDeposits),
      icon: Wallet,
      color: "text-sky-600",
      bgColor: "bg-sky-50 dark:bg-sky-900/20",
    },
  ];

  const recentTransactions = useMemo(() => {
    const income: RecentRecord[] = filteredIncomeRecords.map((record) => ({
      ...record,
      source: "INCOME",
    }));

    const wallet: RecentRecord[] = filteredWalletRecords.map((record) => ({
      ...record,
      source: "WALLET",
    }));

    return [...income, ...wallet]
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 8);
  }, [filteredIncomeRecords, filteredWalletRecords]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tổng quan hệ thống
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Theo dõi doanh thu và giao dịch gần nhất theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-900">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
            <Activity className="text-primary h-4 w-4" />
          </div>
          <span className="text-sm font-medium dark:text-slate-300">
            Hệ thống: <span className="font-bold text-emerald-500">Hoạt động ổn định</span>
          </span>
        </div>
      </div>

      <Card className="mb-8 border-0 shadow-sm dark:bg-slate-900">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Khoảng thời gian phân tích
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dữ liệu biểu đồ và giao dịch gần đây đang áp dụng: {rangeLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={rangeMode === option.value ? "default" : "outline"}
                  onClick={() => setRangeMode(option.value)}>
                  {option.label}
                </Button>
              ))}

              <Button
                size="sm"
                variant={rangeMode === "custom" ? "default" : "outline"}
                onClick={() => setRangeMode("custom")}>
                Tùy chỉnh
              </Button>
            </div>
          </div>

          {rangeMode === "custom" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start",
                      !customFrom && "text-slate-400 dark:text-slate-500"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customFrom ? format(customFrom, "dd/MM/yyyy") : "Từ ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={handleCustomFromChange}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start",
                      !customTo && "text-slate-400 dark:text-slate-500"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customTo ? format(customTo, "dd/MM/yyyy") : "Đến ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={handleCustomToChange}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {rangeMode === "custom" && (!customFrom || !customTo || customFrom > customTo) && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Vui lòng chọn đủ từ ngày và đến ngày hợp lệ. Trong lúc này hệ thống dùng mặc định 30
              ngày gần nhất.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={cn("rounded-xl p-3", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
            <div
              className={cn(
                "absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-5 blur-xl",
                stat.bgColor
              )}
            />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sm dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-violet-600">
              <DollarSign className="h-5 w-5" />
              Xu hướng doanh thu trực tiếp
            </CardTitle>
            <CardDescription>
              Biến động doanh thu trong {rangeDays} ngày theo bộ lọc
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeTrendData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(1)}M`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;

                      const item = payload[0] as { value?: number; payload?: TrendPoint };
                      return (
                        <div className="rounded-lg border bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-xs font-bold">{item.payload?.date}</p>
                          <p className="text-sm font-black text-violet-600">
                            {formatCurrency(item.value || 0)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-sky-600">
              <Wallet className="h-5 w-5" />
              Xu hướng nạp tiền vào ví
            </CardTitle>
            <CardDescription>Biến động nạp ví trong {rangeDays} ngày theo bộ lọc</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={walletTrendData}>
                  <defs>
                    <linearGradient id="colorWallet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(1)}M`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;

                      const item = payload[0] as { value?: number; payload?: TrendPoint };
                      return (
                        <div className="rounded-lg border bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-xs font-bold">{item.payload?.date}</p>
                          <p className="text-sm font-black text-sky-600">
                            {formatCurrency(item.value || 0)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWallet)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-0 shadow-sm dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-600">
            <Activity className="h-5 w-5" />
            Mức độ sử dụng các tính năng
          </CardTitle>
          <CardDescription>
            Thống kê số lượt sử dụng các tính năng chính trong {rangeDays} ngày theo bộ lọc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usageChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;

                    const item = payload[0] as {
                      value?: number;
                      payload?: (typeof usageChartData)[0];
                    };
                    return (
                      <div className="rounded-lg border bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-bold text-slate-500">{item.payload?.name}</p>
                        <p className="text-lg font-black" style={{ color: item.payload?.color }}>
                          {item.value?.toLocaleString("vi-VN")} lượt
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {usageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-0 shadow-sm dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg">Giao dịch gần đây</CardTitle>
          <CardDescription>8 giao dịch mới nhất trong khoảng {rangeLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {!loadingIncome && !loadingTransactions && recentTransactions.length === 0 ? (
              <div className="col-span-2 py-10 text-center text-slate-400">
                Không có dữ liệu giao dịch.
              </div>
            ) : (
              recentTransactions.map((record, index) => {
                const statusLabel =
                  record.source === "INCOME" ? getPaymentStatusLabel(record.status) : "Hoàn tất";

                const successState =
                  record.source === "INCOME" ? isSuccessPayment(record.status) : true;

                return (
                  <div
                    key={`${record.source}-${record.id || record.transactionCode || index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          record.source === "INCOME"
                            ? "bg-violet-100 text-violet-600"
                            : "bg-sky-100 text-sky-600"
                        )}>
                        {record.source === "INCOME" ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <Wallet className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="max-w-[150px] truncate text-sm font-bold text-slate-900 dark:text-white">
                            {record.description || record.transactionCode || "Không có mô tả"}
                          </p>
                          <Badge
                            className={cn(
                              "h-3.5 text-[8px]",
                              record.source === "INCOME" ? "bg-violet-500" : "bg-sky-500"
                            )}>
                            {record.source === "INCOME" ? "THU NHẬP" : "NẠP VÍ"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatTransactionTime(record.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-black",
                          successState ? "text-emerald-600" : "text-amber-600"
                        )}>
                        {formatCurrency(record.amount || 0)}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">{statusLabel}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
