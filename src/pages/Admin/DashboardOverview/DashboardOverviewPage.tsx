/**
 * Admin Dashboard Overview Page
 * First page users see when accessing the admin panel
 * Currently shows placeholder data - will be updated when BE implements dashboard API
 */

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Calendar,
  DollarSign,
  MessageSquare,
  Star,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Placeholder stats for the dashboard
const OVERVIEW_STATS = [
  {
    title: "Tổng người dùng",
    value: "2.847",
    change: "+12,5%",
    trend: "up" as const,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Mentor đang hoạt động",
    value: "156",
    change: "+8,2%",
    trend: "up" as const,
    icon: UserCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    title: "Phiên trong tháng",
    value: "423",
    change: "+23,1%",
    trend: "up" as const,
    icon: Video,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    title: "Doanh thu",
    value: "12.450.000₫",
    change: "-4,3%",
    trend: "down" as const,
    icon: DollarSign,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
];

const SECONDARY_STATS = [
  {
    title: "Đăng ký mới",
    value: "89",
    subtitle: "Tuần này",
    icon: UserPlus,
    color: "text-cyan-600",
  },
  {
    title: "Đánh giá chờ duyệt",
    value: "24",
    subtitle: "Cần xử lý",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    title: "Phản hồi chưa đọc",
    value: "18",
    subtitle: "Từ người dùng",
    icon: MessageSquare,
    color: "text-pink-600",
  },
  {
    title: "Thông báo đã gửi",
    value: "156",
    subtitle: "7 ngày qua",
    icon: Bell,
    color: "text-red-600",
  },
];

// Placeholder recent activity
const RECENT_ACTIVITY = [
  {
    id: 1,
    type: "user_registered",
    title: "Người dùng mới đăng ký",
    description: "Nguyễn Văn A đã tham gia nền tảng",
    time: "2 phút trước",
    avatar: null,
    name: "Nguyễn Văn A",
  },
  {
    id: 2,
    type: "session_completed",
    title: "Phiên phỏng vấn hoàn thành",
    description: "Phiên phỏng vấn #423 đã kết thúc",
    time: "15 phút trước",
    avatar: null,
    name: "Phiên",
  },
  {
    id: 3,
    type: "mentor_approved",
    title: "Mentor được duyệt",
    description: "Hồ sơ mentor của Trần Thị B đã được duyệt",
    time: "1 giờ trước",
    avatar: null,
    name: "Trần Thị B",
  },
  {
    id: 4,
    type: "review_posted",
    title: "Đánh giá mới",
    description: "Đánh giá 5 sao cho mentor Lê Văn C",
    time: "2 giờ trước",
    avatar: null,
    name: "Đánh giá",
  },
  {
    id: 5,
    type: "payment_received",
    title: "Thanh toán nhận được",
    description: "Thanh toán 500.000₫ cho phiên cao cấp",
    time: "3 giờ trước",
    avatar: null,
    name: "Thanh toán",
  },
];

// Placeholder upcoming sessions
const UPCOMING_SESSIONS = [
  {
    id: 1,
    mentor: "Ts. Nguyễn Thị Hương",
    user: "Trần Văn Minh",
    time: "Hôm nay, 14:00",
    type: "Phỏng vấn kỹ thuật",
    status: "confirmed",
  },
  {
    id: 2,
    mentor: "Lê Quốc Hưng",
    user: "Phạm Thị Lan",
    time: "Hôm nay, 16:30",
    type: "Phỏng vấn hành vi",
    status: "pending",
  },
  {
    id: 3,
    mentor: "Vương Thị Mai",
    user: "Hoàng Văn Long",
    time: "Ngày mai, 10:00",
    type: "Phỏng vấn thử",
    status: "confirmed",
  },
  {
    id: 4,
    mentor: "Bùi Văn Tùng",
    user: "Trương Thị Thu",
    time: "Ngày mai, 14:00",
    type: "Thiết kế hệ thống",
    status: "confirmed",
  },
];

// Top performing mentors placeholder
const TOP_MENTORS = [
  { id: 1, name: "Ts. Nguyễn Thị Hương", sessions: 45, rating: 4.9, earnings: "2.850.000₫" },
  { id: 2, name: "Lê Quốc Hưng", sessions: 38, rating: 4.8, earnings: "2.280.000₫" },
  { id: 3, name: "Vương Thị Mai", sessions: 34, rating: 4.9, earnings: "2.040.000₫" },
  { id: 4, name: "Bùi Văn Tùng", sessions: 31, rating: 4.7, earnings: "1.860.000₫" },
  { id: 5, name: "Trần Thị Hà", sessions: 28, rating: 4.8, earnings: "1.680.000₫" },
];

export function DashboardOverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tổng quan bảng điều khiển
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Chào mững trở lại! Dưới đây là những gì đang xảy ra trên nền tảng hôm nay.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OVERVIEW_STATS.map((stat) => (
          <Card
            key={stat.title}
            className="overflow-hidden border-0 shadow-sm dark:bg-slate-900 dark:shadow-slate-800/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={cn("rounded-xl p-3", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="mr-1 h-4 w-4 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-emerald-600" : "text-red-600"}>
                  {stat.change}
                </span>
                <span className="ml-1 text-slate-500 dark:text-slate-400">so với tháng trước</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECONDARY_STATS.map((stat) => (
          <Card
            key={stat.title}
            className="border-0 shadow-sm dark:bg-slate-900 dark:shadow-slate-800/10">
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
                )}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-0 shadow-sm lg:col-span-2 dark:bg-slate-900 dark:shadow-slate-800/10">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
            </div>
            <CardDescription>Cập nhật mới nhất từ nền tảng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      {activity.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{activity.title}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {activity.description}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card className="border-0 shadow-sm dark:bg-slate-900 dark:shadow-slate-800/10">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Phiên sắp tới</CardTitle>
            </div>
            <CardDescription>Các buổi phỏng vấn đã lịch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {UPCOMING_SESSIONS.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {session.mentor}
                    </span>
                    <Badge
                      variant={session.status === "confirmed" ? "default" : "secondary"}
                      className={
                        session.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : ""
                      }>
                      {session.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    with {session.user}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{session.time}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {session.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Mentors */}
      <Card className="mt-6 border-0 shadow-sm dark:bg-slate-900 dark:shadow-slate-800/10">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Top Performing Mentors</CardTitle>
          </div>
          <CardDescription>Based on sessions completed this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left dark:border-slate-800">
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Hạng
                  </th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Mentor
                  </th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Phiên
                  </th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Đánh giá
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">
                    Thu nhập
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOP_MENTORS.map((mentor, index) => (
                  <tr
                    key={mentor.id}
                    className="border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                    <td className="py-3">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                          index === 0
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500"
                            : index === 1
                              ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              : index === 2
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-xs text-white">
                            {mentor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {mentor.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{mentor.sessions}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-slate-600 dark:text-slate-300">{mentor.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-600 dark:text-emerald-500">
                      {mentor.earnings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Note */}
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium">Lưu ý:</span> Bảng điều khiển này hiển thị dữ liệu mẫu.
          Thống kê thực tế sẽ có khi backend triển khai API.
        </p>
      </div>
    </div>
  );
}
