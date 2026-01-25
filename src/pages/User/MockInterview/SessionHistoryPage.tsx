/**
 * Session History Page
 * Displays user's completed interview sessions with option to write reviews
 */

import { Calendar, Clock, Star, User, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { useMentorReviews } from "@/hooks/useMentorReview";
import { useUserSessions } from "@/hooks/useSession";
import type { Session } from "@/interfaces";

// Status badge mapping
const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  SCHEDULED: { label: "Đã lên lịch", variant: "secondary" },
  ACTIVE: { label: "Đang diễn ra", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "outline" },
  CANCELED: { label: "Đã hủy", variant: "destructive" },
};

interface SessionCardProps {
  session: Session;
  hasReview: boolean;
  onViewDetails: () => void;
  onWriteReview: () => void;
}

function SessionCard({ session, hasReview, onViewDetails, onWriteReview }: SessionCardProps) {
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0047AB]/10">
              <Video className="h-5 w-5 text-[#0047AB]" />
            </div>
            <div>
              <CardTitle className="text-base">
                {session.roomName || `Phiên #${session.id}`}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Mentor #{session.userId2}
              </CardDescription>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            ID: {session.id}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {session.status}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            Xem chi tiết
          </Button>
          {isCompleted && !hasReview && (
            <Button size="sm" onClick={onWriteReview} className="gap-1">
              <Star className="h-4 w-4" />
              Viết đánh giá
            </Button>
          )}
          {isCompleted && hasReview && (
            <Button variant="secondary" size="sm" disabled className="gap-1">
              <Star className="h-4 w-4 text-[#FFD700]" />
              Đã đánh giá
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionHistoryPage() {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions();
  const { data: reviews = [], isLoading: reviewsLoading } = useMentorReviews();

  const isLoading = sessionsLoading || reviewsLoading;

  // Get reviewed session IDs
  const reviewedSessionIds = new Set(
    reviews.map((r: { session?: { id?: number } }) => r.session?.id).filter(Boolean)
  );

  // Sort sessions by ID descending (newest first)
  const sortedSessions = [...sessions].sort((a, b) => (b.id || 0) - (a.id || 0));

  const handleViewDetails = (session: Session) => {
    navigate(`/dashboard/mock-interview/history/${session.id}`);
  };

  const handleWriteReview = (session: Session) => {
    navigate(`/dashboard/mock-interview/history/${session.id}/review`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Lịch Sử Phỏng Vấn</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Xem lại các phiên phỏng vấn và viết đánh giá cho mentor
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng phiên</CardDescription>
            <CardTitle className="text-2xl">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {sessions.filter((s) => s.status === "COMPLETED").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã đánh giá</CardDescription>
            <CardTitle className="text-2xl text-[#0047AB]">
              {sessions.filter((s) => reviewedSessionIds.has(s.id)).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ đánh giá</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {
                sessions.filter((s) => s.status === "COMPLETED" && !reviewedSessionIds.has(s.id))
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Session List */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Chưa có phiên phỏng vấn"
          description="Bạn chưa có phiên phỏng vấn nào. Hãy đặt lịch phỏng vấn với mentor!"
          action={
            <Button onClick={() => navigate("/dashboard/mock-interview/select-mentor")}>
              Đặt lịch phỏng vấn
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sortedSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              hasReview={reviewedSessionIds.has(session.id)}
              onViewDetails={() => handleViewDetails(session)}
              onWriteReview={() => handleWriteReview(session)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
