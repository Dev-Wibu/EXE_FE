import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PaymentEntity } from "@/interfaces";
import {
  formatCurrency,
  formatDayMonth,
  formatTimeDayMonth,
  toTimestamp,
  toVietnamDateKey,
} from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { dashboardAdminManager } from "@/services";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import {
  Activity,
  Calendar as CalendarIcon,
  CreditCard,
  DollarSign,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  key: string;
  date: string;
  amount: number;
};
type RangeMode = "7" | "14" | "30" | "custom";
type EffectiveRange = {
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
};
const DEFAULT_RANGE_DAYS = 30;
const isSuccessPayment = (status?: PaymentEntity["status"]) => {
  if (!status) return true;
  const normalized = status.toUpperCase();
  return normalized === "COMPLETED" || normalized === "SUCCESS" || normalized === "PAID";
};
const toMillis = (value?: string) => {
  return toTimestamp(value) ?? 0;
};
const parseVietnamDateKey = (dateKey: string) => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return {
    year,
    month,
    day,
  };
};
const shiftVietnamDateKey = (dateKey: string, days: number): string | null => {
  const parsed = parseVietnamDateKey(dateKey);
  if (!parsed) {
    return null;
  }
  const utcDate = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return toVietnamDateKey(utcDate);
};
const buildVietnamBoundaryDate = (dateKey: string, isEndOfDay: boolean): Date | null => {
  const parsed = parseVietnamDateKey(dateKey);
  if (!parsed) {
    return null;
  }
  return new Date(
    Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      (isEndOfDay ? 23 : 0) - 7,
      isEndOfDay ? 59 : 0,
      isEndOfDay ? 59 : 0,
      isEndOfDay ? 999 : 0
    )
  );
};
const getSafeVietnamDateKey = (value: Date): string => {
  return toVietnamDateKey(value) || format(value, "yyyy-MM-dd");
};
const isWithinDateRange = (value: string | undefined, fromKey: string, toKey: string) => {
  const dateKey = toVietnamDateKey(value);
  if (!dateKey) {
    return false;
  }
  return dateKey >= fromKey && dateKey <= toKey;
};
const buildTrendData = (
  records: Array<{
    createdAt?: string;
    amount?: number;
  }>,
  fromKey: string,
  toKey: string
) => {
  const pointMap: Record<string, TrendPoint> = {};
  const points: TrendPoint[] = [];
  let cursorKey: string | null = fromKey;
  while (cursorKey && cursorKey <= toKey) {
    const point = {
      key: cursorKey,
      date: formatDayMonth(cursorKey, ""),
      amount: 0,
    };
    pointMap[cursorKey] = point;
    points.push(point);
    cursorKey = shiftVietnamDateKey(cursorKey, 1);
  }
  records.forEach((record) => {
    if (!record.createdAt) return;
    const dateKey = toVietnamDateKey(record.createdAt);
    if (!dateKey) {
      return;
    }
    if (pointMap[dateKey]) {
      pointMap[dateKey].amount += record.amount || 0;
    }
  });
  return points;
};
const getPaymentStatusLabel = (
  status?: PaymentEntity["status"],
  t: (key: string) => string = (k) => k
) => {
  switch (status) {
    case "COMPLETED":
      return t("general.success");
    case "PENDING":
      return t("common.processing1");
    case "FAILED":
      return t("general.failed1");
    default:
      return t("common.completed");
  }
};
const formatTransactionTime = (value?: string, t: (key: string) => string = (k) => k) => {
  if (!value) return t("adminDashboardoverview.noTime");
  return formatTimeDayMonth(value, t("adminDashboardoverview.noTime"));
};
export function DashboardOverviewPage() {
  const { t, i18n } = useTranslation();
  const RANGE_OPTIONS: Array<{
    label: string;
    value: Exclude<RangeMode, "custom">;
  }> = [
    {
      label: t("adminDashboardoverview.7Days"),
      value: "7",
    },
    {
      label: t("adminDashboardoverview.14Days"),
      value: "14",
    },
    {
      label: t("adminDashboardoverview.30Days"),
      value: "30",
    },
  ];
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
  const effectiveRange = useMemo<EffectiveRange>(() => {
    if (rangeMode === "custom" && customFrom && customTo && customFrom <= customTo) {
      const customFromKey = getSafeVietnamDateKey(customFrom);
      const customToKey = getSafeVietnamDateKey(customTo);
      const fromKey = customFromKey <= customToKey ? customFromKey : customToKey;
      const toKey = customFromKey <= customToKey ? customToKey : customFromKey;
      const from = buildVietnamBoundaryDate(fromKey, false);
      const to = buildVietnamBoundaryDate(toKey, true);
      if (from && to) {
        return {
          from,
          to,
          fromKey,
          toKey,
        };
      }
      return {
        from: startOfDay(customFrom),
        to: new Date(customTo),
        fromKey,
        toKey,
      };
    }
    const days = rangeMode === "custom" ? DEFAULT_RANGE_DAYS : Number(rangeMode);
    const todayKey = getSafeVietnamDateKey(new Date());
    const fromKey = shiftVietnamDateKey(todayKey, -(days - 1)) || todayKey;
    const from = buildVietnamBoundaryDate(fromKey, false);
    const to = buildVietnamBoundaryDate(todayKey, true);
    if (from && to) {
      return {
        from,
        to,
        fromKey,
        toKey: todayKey,
      };
    }
    return {
      from: startOfDay(subDays(new Date(), days - 1)),
      to: new Date(),
      fromKey: fromKey,
      toKey: todayKey,
    };
  }, [customFrom, customTo, rangeMode]);
  const rangeLabel = useMemo(() => {
    if (rangeMode === "custom" && customFrom && customTo && customFrom <= customTo) {
      return `${format(customFrom, "dd/MM/yyyy")} - ${format(customTo, "dd/MM/yyyy")}`;
    }
    const days = rangeMode === "custom" ? DEFAULT_RANGE_DAYS : Number(rangeMode);
    return t("general.lastDays", {
      var_0: days,
    });
  }, [customFrom, customTo, rangeMode, t]);
  const rangeDays = useMemo(() => {
    const diff = effectiveRange.to.getTime() - effectiveRange.from.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  }, [effectiveRange]);
  const incomeRecords = useMemo(() => incomeResponse?.data ?? [], [incomeResponse?.data]);
  const filteredIncomeRecords = useMemo(
    () =>
      incomeRecords.filter((record) =>
        isWithinDateRange(record.createdAt, effectiveRange.fromKey, effectiveRange.toKey)
      ),
    [effectiveRange, incomeRecords]
  );
  const stats = useMemo(() => {
    const directRevenue = filteredIncomeRecords
      .filter((payment) => isSuccessPayment(payment.status))
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return {
      directRevenue,
    };
  }, [filteredIncomeRecords]);
  const incomeTrendData = useMemo(() => {
    const successfulIncome = filteredIncomeRecords.filter((payment) =>
      isSuccessPayment(payment.status)
    );
    return buildTrendData(successfulIncome, effectiveRange.fromKey, effectiveRange.toKey);
  }, [effectiveRange, filteredIncomeRecords]);
  const overviewStats = [
    {
      title: t("adminDashboardoverview.totalUsers"),
      value: loadingUsers
        ? "..."
        : (userCount?.data || 0).toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN"),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: t("adminDashboardoverview.mentors"),
      value: loadingMentors
        ? "..."
        : (mentorCount?.data || 0).toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN"),
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: t("adminDashboardoverview.directRevenue"),
      value: loadingIncome ? "..." : formatCurrency(stats.directRevenue),
      icon: DollarSign,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
    },
  ];
  const recentTransactions = useMemo(() => {
    return filteredIncomeRecords
      .filter((payment) => isSuccessPayment(payment.status))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 8)
      .map((record) => ({
        ...record,
        source: "INCOME" as const,
      }));
  }, [filteredIncomeRecords]);
  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("adminDashboardoverview.systemOverview")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("adminDashboardoverview.trackRecentRevenueAndTransactions")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-slate-900">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
            <Activity className="text-primary h-4 w-4" />
          </div>
          <span className="text-sm font-medium dark:text-slate-300">
            {t("adminDashboardoverview.system")}{" "}
            <span className="font-bold text-emerald-500">
              {t("adminDashboardoverview.stableOperation")}
            </span>
          </span>
        </div>
      </div>

      <Card className="mb-8 border-0 shadow-sm dark:bg-slate-900">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t("adminDashboardoverview.analysisPeriod")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("adminDashboardoverview.applicableRecentTradingAndChart")} {rangeLabel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-200 p-1 dark:border-slate-700">
                {RANGE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={rangeMode === option.value ? "default" : "ghost"}
                    onClick={() => setRangeMode(option.value)}>
                    {option.label}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                variant={rangeMode === "custom" ? "default" : "outline"}
                onClick={() => setRangeMode("custom")}>
                {t("adminDashboardoverview.customize")}
              </Button>
            </div>
          </div>

          {rangeMode === "custom" && (
            <div className="grid gap-2 sm:grid-cols-[repeat(2,minmax(180px,auto))_auto] sm:items-center">
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
                    {customFrom ? format(customFrom, "dd/MM/yyyy") : t("common.fromDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={handleCustomFromChange} />
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
                    {customTo ? format(customTo, "dd/MM/yyyy") : t("common.comeDay")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={handleCustomToChange} />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                className="justify-self-start"
                onClick={() => {
                  setCustomFrom(undefined);
                  setCustomTo(undefined);
                }}>
                {t("adminDashboardoverview.deleteCustomDates")}
              </Button>
            </div>
          )}

          {rangeMode === "custom" && (!customFrom || !customTo || customFrom > customTo) && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("adminDashboardoverview.pleaseSelectEnoughFromDate")}
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-0 shadow-sm dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-violet-600">
              <DollarSign className="h-5 w-5" />
              {t("adminDashboardoverview.liveRevenueTrends")}
            </CardTitle>
            <CardDescription>
              {t("adminDashboardoverview.revenueFluctuationsIn")} {rangeDays}{" "}
              {t("adminDashboardoverview.dateByFilter")}
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
                    tick={{
                      fontSize: 10,
                      fill: "#64748b",
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#64748b",
                    }}
                    tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(1)}M`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0] as {
                        value?: number;
                        payload?: TrendPoint;
                      };
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
      </div>

      <Card className="mt-8 border-0 shadow-sm dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg">
            {t("adminDashboardoverview.recentTransactions")}
          </CardTitle>
          <CardDescription>
            {t("adminDashboardoverview.latest8DealsInApprox")} {rangeLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {!loadingIncome && recentTransactions.length === 0 ? (
              <div className="col-span-2 py-10 text-center text-slate-400">
                {t("adminDashboardoverview.noDataAvailable")}
              </div>
            ) : (
              recentTransactions.map((record, index) => {
                const statusLabel = getPaymentStatusLabel(record.status, t);
                const successState = isSuccessPayment(record.status);
                return (
                  <div
                    key={`${record.id || record.transactionCode || index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                        <CreditCard className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="max-w-[150px] truncate text-sm font-bold text-slate-900 dark:text-white">
                            {record.description ||
                              record.transactionCode ||
                              t("adminDashboardoverview.noDescriptionAvailable")}
                          </p>
                          <Badge className="h-3.5 bg-violet-500 text-[8px]">
                            {t("adminDashboardoverview.income")}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatTransactionTime(record.createdAt, t)}
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
