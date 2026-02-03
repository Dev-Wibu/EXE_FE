/**
 * Mentor Students List Page
 * Displays list of students who had sessions with this mentor
 */

import { Calendar, MessageSquare, Star, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaginationControl } from "@/components/shared/PaginationControl";
import { SortButton } from "@/components/shared/SortButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { StarRating } from "@/components/ui/star-rating";
import { useMentorFeedbacksByMentor } from "@/hooks/useMentorFeedback";
import { useMentorReviewsByMentor } from "@/hooks/useMentorReview";
import { usePagination } from "@/hooks/usePagination";
import { useSessions } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import type { Session } from "@/interfaces";
import { useAuthStore } from "@/stores/authStore";

interface StudentInfo {
  id: number;
  name?: string;
  email?: string;
  avatarUrl?: string;
  university?: string;
  sessionCount: number;
  feedbackCount: number;
  reviewCount: number;
  avgRating: number;
  lastSessionDate?: string;
}

export function StudentsListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [pageSize, setPageSize] = useState(10);

  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: feedbacks = [], isLoading: feedbacksLoading } = useMentorFeedbacksByMentor(
    user?.id || 0
  );
  const { data: reviews = [], isLoading: reviewsLoading } = useMentorReviewsByMentor(user?.id || 0);

  const isLoading = sessionsLoading || feedbacksLoading || reviewsLoading;

  // Filter sessions where current user is the mentor (userId2)
  const mentorSessions = allSessions.filter((session: Session) => session.userId2 === user?.id);

  // Group sessions by student (userId)
  const studentsMap = new Map<number, StudentInfo>();

  mentorSessions.forEach((session: Session) => {
    const studentId = session.userId;
    if (!studentId) return;

    if (!studentsMap.has(studentId)) {
      // Find user info from feedbacks or reviews
      const userFeedback = feedbacks.find(
        (f: { user?: { id?: number } }) => f.user?.id === studentId
      );
      const userReview = reviews.find((r: { user?: { id?: number } }) => r.user?.id === studentId);
      const userInfo = userFeedback?.user || userReview?.user || null;

      studentsMap.set(studentId, {
        id: studentId,
        name: userInfo?.name,
        email: userInfo?.email,
        avatarUrl: userInfo?.avatarUrl,
        university: userInfo?.university,
        sessionCount: 0,
        feedbackCount: 0,
        reviewCount: 0,
        avgRating: 0,
        lastSessionDate: undefined,
      });
    }

    const student = studentsMap.get(studentId)!;
    student.sessionCount += 1;

    // Track last session
    if (
      !student.lastSessionDate ||
      (session.endTime1 && session.endTime1 > student.lastSessionDate)
    ) {
      student.lastSessionDate = session.endTime1;
    }
  });

  // Add feedback and review counts
  feedbacks.forEach((feedback: { user?: { id?: number } }) => {
    const studentId = feedback.user?.id;
    if (studentId && studentsMap.has(studentId)) {
      studentsMap.get(studentId)!.feedbackCount += 1;
    }
  });

  reviews.forEach((review: { user?: { id?: number }; rating?: number }) => {
    const studentId = review.user?.id;
    if (studentId && studentsMap.has(studentId)) {
      const student = studentsMap.get(studentId)!;
      student.reviewCount += 1;
    }
  });

  // Calculate average rating from reviews
  studentsMap.forEach((student) => {
    const studentReviews = reviews.filter(
      (r: { user?: { id?: number } }) => r.user?.id === student.id
    );
    if (studentReviews.length > 0) {
      const total = studentReviews.reduce(
        (sum: number, r: { rating?: number }) => sum + (r.rating || 0),
        0
      );
      student.avgRating = total / studentReviews.length;
    }
  });

  const students = Array.from(studentsMap.values());

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(students);

  // Apply pagination
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Học Viên</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Danh sách học viên đã có phiên phỏng vấn với bạn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Tổng học viên
            </CardDescription>
            <CardTitle className="text-2xl">{students.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Tổng phiên
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{mentorSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Phản hồi đã gửi
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{feedbacks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              Đánh giá nhận được
            </CardDescription>
            <CardTitle className="text-2xl text-[#FFD700]">{reviews.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Student List */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <CardTitle>Danh Sách Học Viên</CardTitle>
          </div>
          <CardDescription>Học viên đã tham gia phỏng vấn với bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={4} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có học viên"
              description="Bạn chưa có phiên phỏng vấn nào với học viên."
            />
          ) : (
            <>
              {/* Sort Controls */}
              <div className="mb-4 flex items-center gap-4 border-b pb-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sắp xếp theo:
                </span>
                <SortButton {...getSortProps("sessionCount")}>Số phiên</SortButton>
                <SortButton {...getSortProps("avgRating")}>Đánh giá</SortButton>
                <SortButton {...getSortProps("name")}>Tên</SortButton>
              </div>

              <div className="space-y-4">
                {pageData.map((student) => (
                  <div
                    key={student.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-emerald-100 p-4 transition-colors hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    onClick={() => navigate(`/mentor/students/${student.id}`)}>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {student.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {student.name || `Học viên #${student.id}`}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {student.email || student.university}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-slate-500">Phiên</p>
                        <p className="font-semibold">{student.sessionCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">Phản hồi</p>
                        <Badge variant={student.feedbackCount > 0 ? "default" : "secondary"}>
                          {student.feedbackCount}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">Đánh giá</p>
                        {student.reviewCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <StarRating value={student.avgRating} readOnly size="sm" />
                            <span className="text-xs text-slate-500">({student.reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <PaginationControl
                  pagination={pagination}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
