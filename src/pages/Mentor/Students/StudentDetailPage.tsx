import { useTranslation } from "react-i18next";
/**
 * Student Detail Page (Mentor View)
 * Displays student profile and session/feedback history
 */

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
export function StudentDetailPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{
    userId: string;
  }>();
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
    (feedback: {
      user?: {
        id?: number;
      };
      mentor?: {
        id?: number;
      };
    }) => feedback.user?.id === studentId && feedback.mentor?.id === currentUser?.id
  );

  // Filter reviews from this student for current mentor
  const studentReviews = allReviews.filter(
    (review: {
      user?: {
        id?: number;
      };
      mentor?: {
        id?: number;
      };
    }) => review.user?.id === studentId && review.mentor?.id === currentUser?.id
  );

  // Get student info from feedbacks or reviews
  const studentInfo = studentFeedbacks[0]?.user ||
    studentReviews[0]?.user || {
      id: studentId,
    };

  // Calculate stats
  const totalSessions = studentSessions.length;
  const completedSessions = studentSessions.filter((s: Session) => s.status === "COMPLETED").length;
  const totalFeedbacks = studentFeedbacks.length;
  const totalReviews = studentReviews.length;
  const avgRating =
    totalReviews > 0
      ? studentReviews.reduce(
          (
            sum: number,
            r: {
              rating?: number;
            }
          ) => sum + (r.rating || 0),
          0
        ) / totalReviews
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
          {t("general.back")}
        </Button>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">{t("mentorStudents.noStudentFound")}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("mentorStudents.thisStudentDoesNotExist")}
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
        {t("common.backToTheList")}
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
                {studentInfo.name ||
                  t("common.studentVar0", {
                    var_0: studentId,
                  })}
              </CardTitle>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                {studentInfo.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {studentInfo.email}
                  </p>
                )}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(studentInfo as any).university && (
                  <p className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(studentInfo as any).university}
                  </p>
                )}
              </div>
              {totalReviews > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {t("mentorStudents.studentReviews")}
                  </span>
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
              {t("common.totalSession")}
            </CardDescription>
            <CardTitle className="text-2xl">{totalSessions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>{t("general.completed")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">{completedSessions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {t("common.responseReceived")}
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{totalFeedbacks}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {t("mentorMentordashboard.reviewSent")}
            </CardDescription>
            <CardTitle className="text-2xl text-[#FFD700]">{totalReviews}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs: Sessions, Feedbacks, Reviews */}
      <Tabs defaultValue="sessions">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">
            {t("general.session8")}
            {totalSessions})
          </TabsTrigger>
          <TabsTrigger value="feedbacks">
            {t("mentorStudents.responseReceived1")}
            {totalFeedbacks})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            {t("mentorStudents.submittedReview")}
            {totalReviews})
          </TabsTrigger>
          <TabsTrigger value="profile">
            <FileText className="mr-1 h-4 w-4" />
            {t("mentorStudents.file")}
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="border-emerald-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle>{t("mentorStudents.interviewSessionHistory")}</CardTitle>
              <CardDescription>
                {t("mentorStudents.interviewSessionsWithThisStudent")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentSessions.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title={t("mentorStudents.thereAreNoSessionsYet")}
                  description={t("mentorStudents.thereHasBeenNoInterview")}
                />
              ) : (
                <div className="space-y-4">
                  {studentSessions.map((session: Session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-100 p-4 dark:border-slate-800">
                      <div>
                        <p className="font-medium">
                          {session.roomName ||
                            t("common.sessionVar0", {
                              var_0: session.id,
                            })}
                        </p>
                        <p className="text-sm text-slate-500">
                          {t("common.id")}: {session.id}
                        </p>
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
                          ? t("general.completed")
                          : session.status === "CANCELED"
                            ? t("common.canceled")
                            : session.status === "ONGOING"
                              ? t("common.ongoing")
                              : t("common.scheduled")}
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
              <CardTitle>{t("mentorStudents.feedbackFromStudents")}</CardTitle>
              <CardDescription>{t("mentorStudents.theseStudentResponsesWereSent")}</CardDescription>
            </CardHeader>
            <CardContent>
              {studentFeedbacks.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title={t("common.noResponseYet")}
                  description={t("mentorStudents.thisStudentHasNotSent")}
                />
              ) : (
                <div className="space-y-4">
                  {studentFeedbacks.map(
                    (feedback: {
                      id?: number;
                      session?: {
                        id?: number;
                      };
                    }) => (
                      <FeedbackCard
                        key={feedback.id}
                        feedback={feedback}
                        showMentor={false}
                        showUser
                        showSession
                      />
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-4">
          <Card className="border-emerald-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle>{t("common.reviewSubmitted")}</CardTitle>
              <CardDescription>{t("mentorStudents.reviewsYouHaveSubmittedFor")}</CardDescription>
            </CardHeader>
            <CardContent>
              {studentReviews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title={t("common.thereAreNoReviewsYet")}
                  description={t("mentorStudents.youHaveNotSubmittedAny")}
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
              <CardTitle>{t("mentorStudents.candidateProfile")}</CardTitle>
              <CardDescription>
                {t("mentorStudents.studentCandidateProfileInformation")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!candidateProfile?.id ? (
                <EmptyState
                  icon={FileText}
                  title={t("common.thereAreNoCandidateProfilesYet")}
                  description={t("mentorStudents.thisStudentHasNotCreated")}
                />
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="mb-2 font-semibold">{t("common.basicInformation")}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">
                          {t("mentorStudents.targetRole")}
                        </span>{" "}
                        {candidateProfile.targetRole || "—"}
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">
                          {t("mentorStudents.level")}
                        </span>{" "}
                        {candidateProfile.targetLevel || "—"}
                      </div>
                    </div>
                    {candidateProfile.introduction && (
                      <p className="mt-2 text-sm">{candidateProfile.introduction}</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="mb-2 font-semibold">{t("common.skill")}</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          {t("mentorStudents.technicalSkills")}
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
                          {t("mentorStudents.softSkills")}
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
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          {t("mentorStudents.tools")}
                        </span>
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
                      <h4 className="mb-2 font-semibold">{t("common.project")}</h4>
                      <div className="space-y-2">
                        {candidateProfile.projects!.map((p, i) => (
                          <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-gray-600 dark:text-slate-300">{p.description}</p>
                            <p className="text-gray-500 dark:text-slate-400">
                              {p.role} {t("mentorStudents.team")} {p.teamSize}{" "}
                              {t("mentorStudents.people")} {p.outcome}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {(candidateProfile.workExperiences ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">{t("common.workExperience")}</h4>
                      <div className="space-y-2">
                        {candidateProfile.workExperiences!.map((w, i) => (
                          <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                            <p className="font-medium">
                              {w.position} — {w.company}
                            </p>
                            <p className="text-gray-600 dark:text-slate-300">{w.description}</p>
                            <p className="text-xs text-gray-400">
                              {w.start_date} — {w.end_date || t("common.present")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {(candidateProfile.educations ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">{t("common.education")}</h4>
                      <div className="space-y-2">
                        {candidateProfile.educations!.map((e, i) => (
                          <div key={i} className="rounded border p-3 text-sm dark:border-slate-700">
                            <p className="font-medium">{e.school}</p>
                            <p className="text-gray-600 dark:text-slate-300">
                              {e.major} — {e.degree}
                            </p>
                            {e.gpa && (
                              <p>
                                {t("common.gpa")}: {e.gpa}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {e.start_date} — {e.end_date || t("common.present")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {(candidateProfile.certifications ?? []).length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">{t("common.certificate")}</h4>
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
                      <h4 className="mb-2 font-semibold">{t("common.achievements")}</h4>
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
