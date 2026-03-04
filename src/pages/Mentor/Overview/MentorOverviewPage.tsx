import { Calendar, Star, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatting";
import { useAuthStore } from "@/stores/authStore";

export function MentorOverviewPage() {
  const { user } = useAuthStore();

  // Mock stats - will be replaced with real data from API
  const stats = {
    totalSessions: 24,
    completedSessions: 20,
    upcomingSessions: 4,
    totalStudents: 15,
    averageRating: 4.8,
    totalEarnings: 12000000,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Chào mừng trở lại, {user?.name || "Mentor"}!</h1>
        <p className="mt-2 text-emerald-100">
          Đây là tổng quan hoạt động của bạn trên nền tảng INBLUE AI
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sessions */}
        <Card className="border-emerald-100 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Tổng phiên phỏng vấn
            </CardTitle>
            <Calendar className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-800 dark:text-white">
              {stats.totalSessions}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {stats.completedSessions} hoàn thành • {stats.upcomingSessions} sắp tới
            </p>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card className="border-blue-100 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Học viên
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-800 dark:text-white">
              {stats.totalStudents}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Học viên đã hỗ trợ</p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="border-yellow-100 dark:border-yellow-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Đánh giá trung bình
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-800 dark:text-white">
                {stats.averageRating}
              </span>
              <span className="text-lg text-gray-500">/5</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Từ học viên</p>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="border-green-100 dark:border-green-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Tổng thu nhập
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-800 dark:text-white">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Tháng này</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phiên phỏng vấn sắp tới</CardTitle>
            <CardDescription>Các phiên bạn cần tham gia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm">Chưa có phiên nào</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đánh giá gần đây</CardTitle>
            <CardDescription>Phản hồi từ học viên</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <Star className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm">Chưa có đánh giá nào</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
