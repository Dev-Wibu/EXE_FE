/**
 * Student Detail Page (Mentor View)
 * Displays student profile and session/feedback history
 */

import {
  ArrowLeft,
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  School,
  Star,
  User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { FeedbackCard } from "@/components/feedback";
import { ReviewCard } from "@/components/review";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMentorFeedbacks } from "@/hooks/useMentorFeedback";
import { useMentorReviews } from "@/hooks/useMentorReview";
import { useSessions } from "@/hooks/useSession";
import type { Session } from "@/interfaces";
import type { CandidateProfile } from "@/interfaces/schema.types";
import { useCandidateProfile } from "@/services/candidate-profile.manager";
import { useAuthStore } from "@/stores/authStore";

export function StudentDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const studentId = Number(userId);

  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: allFeedbacks = [], isLoading: feedbacksLoading } = useMentorFeedbacks();
  const { data: allReviews = [], isLoading: reviewsLoading } = useMentorReviews();
  const { data: candidateProfileData, isLoading: profileLoading } = useCandidateProfile(studentId);
  const candidateProfile = (candidateProfileData as unknown as CandidateProfile) ?? null;

  const isLoading = sessionsLoading || feedbacksLoading || reviewsLoading || profileLoading;

  // Filter sessions for this student with current mentor
  const studentSessions = allSessions.filter(
    (session: Session) => session.userId === studentId && session.userId2 === currentUser?.id
  );

  // Filter feedbacks for this student from current mentor
  const studentFeedbacks = allFeedbacks.filter(
    (feedback: { user?: { id?: number }; mentor?: { id?: number } }) =>
      feedback.user?.id === studentId && feedback.mentor?.id === currentUser?.id
  );

  // Filter reviews from this student for current mentor
  const studentReviews = allReviews.filter(
    (review: { user?: { id?: number }; mentor?: { id?: number } }) =>
      review.user?.id === studentId && review.mentor?.id === currentUser?.id
  );

  // Get student info from feedbacks or reviews
  const studentInfo = studentFeedbacks[0]?.user || studentReviews[0]?.user || { id: studentId };

  // Calculate stats
  const totalSessions = studentSessions.length;
  const completedSessions = studentSessions.filter((s: Session) => s.status === "COMPLETED").length;
  const totalFeedbacks = studentFeedbacks.length;
  const totalReviews = studentReviews.length;
  const avgRating =
    totalReviews > 0
      ? studentReviews.reduce((sum: number, r: { rating?: number }) => sum + (r.rating || 0), 0) /
        totalReviews
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!studentInfo || totalSessions === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/mentor?tab=students")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy học viên</h3>
            <p className="mt-1 text-sm text-slate-500">
              Học viên này không tồn tại hoặc chưa có phiên phỏng vấn với bạn
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/mentor?tab=students")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Student Profile Card */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={studentInfo.avatarUrl} alt={studentInfo.name} />
              <AvatarFallback className="bg-emerald-100 text-2xl text-emerald-700">
                {studentInfo.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {studentInfo.name || `Học viên #${studentId}`}
              </CardTitle>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                {studentInfo.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {studentInfo.email}
                  </p>
                )}
                {studentInfo.university && (
                  <p className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    {studentInfo.university}
                  </p>
                )}
              </div>
              {totalReviews > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-500">Đánh giá của học viên:</span>
                  <StarRating value={avgRating} readOnly size="sm" />
                  <span className="text-sm text-slate-500">({totalReviews})</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Tổng phiên
            </CardDescription>
            <CardTitle className="text-2xl">{totalSessions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl text-green-600">{completedSessions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Phản hồi nhận được
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{totalFeedbacks}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              Đánh giá đã gửi
            </CardDescription>
            <CardTitle className="text-2xl text-[#FFD700]">{totalReviews}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs: Sessions, Feedbacks, Reviews */}
      <Tabs defaultValue="sessions">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Phiên ({totalSessions})</TabsTrigger>
          <TabsTrigger value="feedbacks">Phản hồi nhận ({totalFeedbacks})</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá gửi ({totalReviews})</TabsTrigger>
          <TabsTrigger value="profile">
            <FileText className="mr-1 h-4 w-4" />
            Hồ sơ
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="border-emerald-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Lịch Sử Phiên Phỏng Vấn</CardTitle>
              <CardDescription>Các phiên phỏng vấn với học viên này</CardDescription>
            </CardHeader>
            <CardContent>
              {studentSessions.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Chưa có phiên nào"
                  description="Chưa có phiên phỏng vấn nào với học viên này."
                />
              ) : (
                <div className="space-y-4">
                  {studentSessions.map((session: Session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-100 p-4 dark:border-slate-800">
                      <div>
                        <p className="font-medium">{session.roomName || `Phiên #${session.id}`}</p>
                        <p className="text-sm text-slate-500">ID: {session.id}</p>
                      </div>
                      <Badge
                        variant={
                          session.status === "COMPLETED"
                            ? "default"
                            : session.status === "CANCELED"
                              ? "destructive"
                              : "secondary"
                        }>
                        {session.status === "COMPLETED"
                          ? "Hoàn thành"
                          : session.status === "CANCELED"
                            ? "Đã hủy"
                            : session.status === "ONGOING"
                              ? "Đang diễn ra"
                              : "Đã lên lịch"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedbacks Tab */}
        <TabsContent value="feedbacks" className="mt-4">
          <Card className="border-emerald-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Phản Hồi Từ Học Viên</CardTitle>
              <CardDescription>Các phản hồi học viên này gửi cho bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {studentFeedbacks.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Chưa có phản hồi"
                  description="Học viên này chưa gửi phản hồi nào cho bạn."
                />
              ) : (
                <div className="space-y-4">
                  {studentFeedbacks.map((feedback: { id?: number; session?: { id?: number } }) => (
                    <FeedbackCard
                      key={feedback.id}
                      feedback={feedback}
                      showMentor={false}
                      showUser
                      showSession
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-4">
          <Card className="border-emerald-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Đánh Giá Đã Gửi</CardTitle>
              <CardDescription>Các đánh giá bạn đã gửi cho học viên này</CardDescription>
            </CardHeader>
            <CardContent>
              {studentReviews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="Chưa có đánh giá"
                  description="Bạn chưa gửi đánh giá nào cho học viên này."
                />
              ) : (
                <div className="space-y-4">
                  {studentReviews.map((review: { id?: number }) => (
                    <ReviewCard key={review.id} review={review} showMentor={false} showUser />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-emerald-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Hồ Sơ Ứng Viên</CardTitle>
              <CardDescription>Thông tin hồ sơ ứng viên của học viên</CardDescription>
            </CardHeader>
            <CardContent>
              {!candidateProfile?.id ? (
                <EmptyState
                  icon={FileText}
                  title="Chưa có hồ sơ ứng viên"
                  description="Học viên này chưa tạo hồ sơ ứng viên."
                />
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="mb-2 font-semibold">Thông tin cơ bản</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">Vai trò mục tiêu:</span>{" "}
                        {candidateProfile.targetRole || "—"}
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">Cấp độ:</span>{" "}
                        {candidateProfile.targetLevel || "—"}
                      </div>
                    </div>
                    {candidateProfile.introduction && (
                      <p className="mt-2 text-sm">{candidateProfile.introduction}</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="mb-2 font-semibold">Kỹ năng</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          Kỹ năng kỹ thuật:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(candidateProfile.technicalSkills ?? []).map((s) => (
                            <Badge key={s} variant="secondary">
                              {s}
                            </Badge>
                          ))}
                          {(candidateProfile.technicalSkills ?? []).length === 0 && (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          Kỹ năng mềm:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(candidateProfile.softSkills ?? []).map((s) => (
                            <Badge key={s} variant="outline">
                              {s}
                            </Badge>
                          ))}
                          {(candidateProfile.softSkills ?? []).length === 0 && (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-slate-400">Công cụ:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(candidateProfile.tools ?? []).map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                          {(candidateProfile.tools ?? []).length === 0 && (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projects */}
                  {(candidateProfile.projects ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Dự án</h4>
                      <div className="space-y-2">
                        {candidateProfile.projects!.map((p, i) => (
                          <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-gray-600 dark:text-slate-300">{p.description}</p>
                            <p className="text-gray-500 dark:text-slate-400">
                              {p.role} · Đội {p.teamSize} người · {p.outcome}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {(candidateProfile.workExperiences ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Kinh nghiệm làm việc</h4>
                      <div className="space-y-2">
                        {candidateProfile.workExperiences!.map((w, i) => (
                          <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                            <p className="font-medium">
                              {w.position} — {w.company}
                            </p>
                            <p className="text-gray-600 dark:text-slate-300">{w.description}</p>
                            <p className="text-xs text-gray-400">
                              {w.start_date} — {w.end_date || "Hiện tại"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {(candidateProfile.educations ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Học vấn</h4>
                      <div className="space-y-2">
                        {candidateProfile.educations!.map((e, i) => (
                          <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                            <p className="font-medium">{e.school}</p>
                            <p className="text-gray-600 dark:text-slate-300">
                              {e.major} — {e.degree}
                            </p>
                            {e.gpa && <p>GPA: {e.gpa}</p>}
                            <p className="text-xs text-gray-400">
                              {e.start_date} — {e.end_date || "Hiện tại"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {(candidateProfile.certifications ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Chứng chỉ</h4>
                      <div className="flex flex-wrap gap-1">
                        {candidateProfile.certifications!.map((c) => (
                          <Badge key={c} variant="secondary">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {(candidateProfile.achievements ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Thành tích</h4>
                      <div className="flex flex-wrap gap-1">
                        {candidateProfile.achievements!.map((a) => (
                          <Badge key={a} variant="outline">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
