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
    title: "Total Users",
    value: "2,847",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Active Mentors",
    value: "156",
    change: "+8.2%",
    trend: "up" as const,
    icon: UserCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    title: "Sessions This Month",
    value: "423",
    change: "+23.1%",
    trend: "up" as const,
    icon: Video,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    title: "Revenue",
    value: "$12,450",
    change: "-4.3%",
    trend: "down" as const,
    icon: DollarSign,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
];

const SECONDARY_STATS = [
  {
    title: "New Registrations",
    value: "89",
    subtitle: "This week",
    icon: UserPlus,
    color: "text-cyan-600",
  },
  {
    title: "Pending Reviews",
    value: "24",
    subtitle: "Need attention",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    title: "Unread Feedback",
    value: "18",
    subtitle: "From users",
    icon: MessageSquare,
    color: "text-pink-600",
  },
  {
    title: "Notifications Sent",
    value: "156",
    subtitle: "Last 7 days",
    icon: Bell,
    color: "text-red-600",
  },
];

// Placeholder recent activity
const RECENT_ACTIVITY = [
  {
    id: 1,
    type: "user_registered",
    title: "New user registered",
    description: "John Doe joined the platform",
    time: "2 minutes ago",
    avatar: null,
    name: "John Doe",
  },
  {
    id: 2,
    type: "session_completed",
    title: "Session completed",
    description: "Interview session #423 completed",
    time: "15 minutes ago",
    avatar: null,
    name: "Session",
  },
  {
    id: 3,
    type: "mentor_approved",
    title: "Mentor approved",
    description: "Sarah Smith's mentor application approved",
    time: "1 hour ago",
    avatar: null,
    name: "Sarah Smith",
  },
  {
    id: 4,
    type: "review_posted",
    title: "New review posted",
    description: "5-star review for mentor Mike Johnson",
    time: "2 hours ago",
    avatar: null,
    name: "Review",
  },
  {
    id: 5,
    type: "payment_received",
    title: "Payment received",
    description: "$150 payment for premium session",
    time: "3 hours ago",
    avatar: null,
    name: "Payment",
  },
];

// Placeholder upcoming sessions
const UPCOMING_SESSIONS = [
  {
    id: 1,
    mentor: "Dr. Emily Chen",
    user: "Alex Wilson",
    time: "Today, 2:00 PM",
    type: "Technical Interview",
    status: "confirmed",
  },
  {
    id: 2,
    mentor: "James Smith",
    user: "Maria Garcia",
    time: "Today, 4:30 PM",
    type: "Behavioral Interview",
    status: "pending",
  },
  {
    id: 3,
    mentor: "Lisa Wang",
    user: "Robert Brown",
    time: "Tomorrow, 10:00 AM",
    type: "Mock Interview",
    status: "confirmed",
  },
  {
    id: 4,
    mentor: "Michael Lee",
    user: "Jennifer Davis",
    time: "Tomorrow, 2:00 PM",
    type: "System Design",
    status: "confirmed",
  },
];

// Top performing mentors placeholder
const TOP_MENTORS = [
  { id: 1, name: "Dr. Emily Chen", sessions: 45, rating: 4.9, earnings: "$2,850" },
  { id: 2, name: "James Smith", sessions: 38, rating: 4.8, earnings: "$2,280" },
  { id: 3, name: "Lisa Wang", sessions: 34, rating: 4.9, earnings: "$2,040" },
  { id: 4, name: "Michael Lee", sessions: 31, rating: 4.7, earnings: "$1,860" },
  { id: 5, name: "Sarah Johnson", sessions: 28, rating: 4.8, earnings: "$1,680" },
];

export function DashboardOverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Welcome back! Here&apos;s what&apos;s happening with your platform today.
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
                <span className="ml-1 text-slate-500 dark:text-slate-400">vs last month</span>
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
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest updates from your platform</CardDescription>
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
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            </div>
            <CardDescription>Scheduled interviews</CardDescription>
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
                    Rank
                  </th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Mentor
                  </th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Sessions
                  </th>
                  <th className="pb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Rating
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-slate-500 dark:text-slate-400">
                    Earnings
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
          <span className="font-medium">Note:</span> This dashboard displays placeholder data. Real
          statistics will be available when the backend dashboard API is implemented.
        </p>
      </div>
    </div>
  );
}
