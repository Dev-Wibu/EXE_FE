import {
  Calendar,
  CreditCard,
  Headphones,
  Inbox,
  Mail,
  MessageSquare,
  Search,
  Wrench,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Mock support tickets for user support
 * Staff handles user inquiries and issues
 */
const mockTickets = [
  {
    id: 1,
    userName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    subject: "Không thể tham gia phiên phỏng vấn",
    category: "technical",
    status: "open",
    createdAt: "2026-01-23 08:30",
    priority: "high",
  },
  {
    id: 2,
    userName: "Trần Thị B",
    email: "tranthib@example.com",
    subject: "Hỏi về cách thanh toán",
    category: "billing",
    status: "open",
    createdAt: "2026-01-22 16:45",
    priority: "medium",
  },
  {
    id: 3,
    userName: "Lê Văn C",
    email: "levanc@example.com",
    subject: "Muốn thay đổi lịch hẹn",
    category: "booking",
    status: "resolved",
    createdAt: "2026-01-21 10:00",
    priority: "low",
  },
];

export function UserSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTickets = mockTickets.filter((ticket) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      ticket.userName.toLowerCase().includes(lowerQuery) ||
      ticket.email.toLowerCase().includes(lowerQuery) ||
      ticket.subject.toLowerCase().includes(lowerQuery)
    );
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Cao</Badge>;
      case "medium":
        return <Badge variant="secondary">Trung bình</Badge>;
      case "low":
        return <Badge variant="outline">Thấp</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    const cls = "h-5 w-5";
    switch (category) {
      case "technical":
        return <Wrench className={cls} />;
      case "billing":
        return <CreditCard className={cls} />;
      case "booking":
        return <Calendar className={cls} />;
      default:
        return <Inbox className={cls} />;
    }
  };

  const openTickets = filteredTickets.filter((t) => t.status === "open");
  const resolvedTickets = filteredTickets.filter((t) => t.status === "resolved");

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Hỗ Trợ Người Dùng
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Giải đáp thắc mắc và xử lý các yêu cầu hỗ trợ từ người dùng
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ xử lý</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {mockTickets.filter((t) => t.status === "open").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã giải quyết hôm nay</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {mockTickets.filter((t) => t.status === "resolved").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ưu tiên cao</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {mockTickets.filter((t) => t.priority === "high" && t.status === "open").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-96">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm yêu cầu hỗ trợ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open Tickets */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Headphones className="h-5 w-5 text-orange-600" />
            Chờ xử lý ({openTickets.length})
          </h2>
          <div className="space-y-4">
            {openTickets.map((ticket) => (
              <Card key={ticket.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                      <CardTitle className="text-base">{ticket.subject}</CardTitle>
                    </div>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {ticket.userName} - {ticket.email}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{ticket.createdAt}</span>
                    <Button size="sm">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Phản hồi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {openTickets.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Không có yêu cầu nào đang chờ xử lý
              </div>
            )}
          </div>
        </div>

        {/* Resolved Tickets */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="text-green-600">✓</span>
            Đã giải quyết ({resolvedTickets.length})
          </h2>
          <div className="space-y-4">
            {resolvedTickets.map((ticket) => (
              <Card key={ticket.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                    <CardTitle className="text-base">{ticket.subject}</CardTitle>
                  </div>
                  <CardDescription>
                    {ticket.userName} - {ticket.createdAt}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            {resolvedTickets.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Chưa có yêu cầu nào được giải quyết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
