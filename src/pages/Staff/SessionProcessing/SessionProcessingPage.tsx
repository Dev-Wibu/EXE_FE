import { Calendar, Clock, Search, Video } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Mock data for session processing
 * Staff can view and manage interview sessions
 */
const mockSessions = [
  {
    id: 1,
    roomName: "session-001",
    userName: "Nguyễn Văn A",
    mentorName: "Trần Văn Mentor",
    scheduledTime: "2026-01-23 14:00",
    status: "SCHEDULED",
    duration: null,
  },
  {
    id: 2,
    roomName: "session-002",
    userName: "Lê Thị B",
    mentorName: "Phạm Văn Expert",
    scheduledTime: "2026-01-23 10:00",
    status: "ONGOING",
    duration: "15 phút",
  },
  {
    id: 3,
    roomName: "session-003",
    userName: "Hoàng Văn C",
    mentorName: "Nguyễn Expert",
    scheduledTime: "2026-01-22 16:00",
    status: "COMPLETED",
    duration: "45 phút",
  },
  {
    id: 4,
    roomName: "session-004",
    userName: "Đỗ Thị D",
    mentorName: "Trần Mentor Pro",
    scheduledTime: "2026-01-22 09:00",
    status: "CANCELED",
    duration: null,
  },
];

type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELED" | "all";

export function SessionProcessingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus>("all");

  const filteredSessions = mockSessions.filter((session) => {
    // Filter by status
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        session.roomName.toLowerCase().includes(lowerQuery) ||
        session.userName.toLowerCase().includes(lowerQuery) ||
        session.mentorName.toLowerCase().includes(lowerQuery)
      );
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            <Calendar className="mr-1 h-3 w-3" />
            Đã lên lịch
          </Badge>
        );
      case "ONGOING":
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <Video className="mr-1 h-3 w-3 animate-pulse" />
            Đang diễn ra
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
            <Clock className="mr-1 h-3 w-3" />
            Hoàn thành
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Phiên Phỏng Vấn
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Theo dõi và quản lý các phiên phỏng vấn giữa người dùng và mentor
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative w-96">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên phòng, người dùng, mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as SessionStatus)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
              <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 dark:bg-green-900/30">
            <Video className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {mockSessions.filter((s) => s.status === "ONGOING").length} đang diễn ra
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 dark:bg-blue-900/30">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {mockSessions.filter((s) => s.status === "SCHEDULED").length} sắp tới
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên phòng</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Thời lượng</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-sm">{session.roomName}</TableCell>
                <TableCell>{session.userName}</TableCell>
                <TableCell>{session.mentorName}</TableCell>
                <TableCell>{session.scheduledTime}</TableCell>
                <TableCell>{session.duration || "-"}</TableCell>
                <TableCell>{getStatusBadge(session.status)}</TableCell>
              </TableRow>
            ))}
            {filteredSessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                  Không có phiên phỏng vấn nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
