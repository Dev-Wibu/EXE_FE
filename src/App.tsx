import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthLayout } from "@/components/layouts";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/shared";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/contexts/QueryProvider";
import { AdminDashboardPage } from "@/pages/Admin";
import {
  LoginPage,
  MentorRegisterPage,
  SelectRolePage,
  SignupPage,
  WaitingAcceptMentorPage,
} from "@/pages/Auth";
import {
  ForbiddenPage,
  GatewayTimeoutPage,
  NotFoundPage,
  ServerErrorPage,
  ServiceUnavailablePage,
  UnauthorizedPage,
} from "@/pages/Error";
import {
  AIInterviewFeaturePage,
  BlogPage,
  FAQPage,
  HomePage,
  InterviewTipsPage,
  MentorInterviewFeaturePage,
  QuestionBankPage,
} from "@/pages/Homepage";
import {
  MentorDashboardPage,
  MentorSessionRoomPage,
  ReviewDetailPage,
  StudentDetailPage,
  WriteFeedbackPage,
} from "@/pages/Mentor";
import {
  ContentModerationPage,
  FeedbackModerationPage,
  MentorApplicationsPage,
  PostModerationPage,
  ReviewModerationPage,
  SessionProcessingPage,
  StaffDashboardPage,
  UserSupportPage,
} from "@/pages/Staff";
import {
  AIChatConversationPage,
  AIInterviewResultPage,
  AIInterviewSessionPage,
  AIInterviewSetupPage,
  BookingSuccessPage,
  CreatePostPage,
  EditPostPage,
  FeedbackDetailPage,
  MockInterviewSchedulePage,
  MockInterviewSelectMentorPage,
  PostDetailPage,
  PracticeSetDetailPage,
  QuestionDetailPage,
  QuizPage,
  QuizResultPage,
  SessionDetailPage,
  SessionRoomPage,
  UserDashboardPage,
  WriteReviewPage,
} from "@/pages/User";

/** Preserves the path suffix after a given prefix when redirecting /dashboard/* → /user/* */
function DashboardSubRedirect({ prefix }: { prefix: string }) {
  const { pathname, search } = useLocation();
  // Remove the /dashboard/<segment> part to get the suffix
  const suffix = pathname.replace(/^\/dashboard\/[^/]+/, "");
  return <Navigate to={`${prefix}${suffix}${search}`} replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />

            {/* Questions pages (public) */}
            <Route path="/questions/bank" element={<QuestionBankPage />} />
            <Route path="/questions/tips" element={<InterviewTipsPage />} />

            {/* Features pages (public) */}
            <Route path="/features/ai-interview" element={<AIInterviewFeaturePage />} />
            <Route path="/features/mentor-interview" element={<MentorInterviewFeaturePage />} />

            {/* Resources pages (public) */}
            <Route path="/resources/faq" element={<FAQPage />} />
            <Route path="/resources/blog" element={<BlogPage />} />

            {/* Auth routes with AuthLayout — redirect to dashboard if already logged in */}
            <Route element={<PublicOnlyRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>
            </Route>

            {/* Auth routes without layout (full page) */}
            <Route path="/select-role" element={<SelectRolePage />} />
            <Route path="/mentor-register" element={<MentorRegisterPage />} />
            <Route path="/waiting-accept" element={<WaitingAcceptMentorPage />} />

            {/* User Dashboard — ChromeTabs shell at /user, sub-pages nested inside */}
            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route path="/user" element={<UserDashboardPage />}>
                <Route path="ai-interview/setup" element={<AIInterviewSetupPage />} />
                <Route path="ai-interview/session" element={<AIInterviewSessionPage />} />
                <Route path="ai-interview/result/:id" element={<AIInterviewResultPage />} />
                <Route
                  path="mock-interview/select-mentor"
                  element={<MockInterviewSelectMentorPage />}
                />
                <Route path="mock-interview/schedule" element={<MockInterviewSchedulePage />} />
                <Route path="mock-interview/booking-success" element={<BookingSuccessPage />} />
                <Route path="mock-interview/room/:sessionId" element={<SessionRoomPage />} />
                <Route
                  path="mock-interview/history/:sessionId/review"
                  element={<WriteReviewPage />}
                />
                <Route path="mock-interview/history/:sessionId" element={<SessionDetailPage />} />
                <Route path="ai-chat/:id" element={<AIChatConversationPage />} />
                <Route path="questions/:id" element={<QuestionDetailPage />} />
                <Route path="practice/:id/quiz/:quizId/result" element={<QuizResultPage />} />
                <Route path="practice/:id/quiz" element={<QuizPage />} />
                <Route path="practice/session/:sessionId" element={<PracticeSetDetailPage />} />
                <Route path="practice/:id" element={<PracticeSetDetailPage />} />
                <Route path="feedback/:id" element={<FeedbackDetailPage />} />
                <Route path="community/create" element={<CreatePostPage />} />
                <Route path="community/:postId/edit" element={<EditPostPage />} />
                <Route path="community/:postId" element={<PostDetailPage />} />
              </Route>
            </Route>
            {/* Backward-compat redirects for old /dashboard/* URLs */}
            <Route path="/dashboard" element={<Navigate to="/user" replace />} />
            <Route
              path="/dashboard/mock-interview"
              element={<Navigate to="/user?tab=mockInterview" replace />}
            />
            <Route
              path="/dashboard/mock-interview/history"
              element={<Navigate to="/user?tab=interviewHistory" replace />}
            />
            <Route
              path="/dashboard/feedback"
              element={<Navigate to="/user?tab=feedback" replace />}
            />
            <Route
              path="/dashboard/ai-interview"
              element={<Navigate to="/user?tab=aiInterview" replace />}
            />
            <Route path="/dashboard/ai-chat" element={<Navigate to="/user?tab=aiChat" replace />} />
            <Route
              path="/dashboard/questions"
              element={<Navigate to="/user?tab=questions" replace />}
            />
            <Route
              path="/dashboard/practice"
              element={<Navigate to="/user?tab=practice" replace />}
            />
            <Route
              path="/dashboard/community"
              element={<Navigate to="/user?tab=community" replace />}
            />
            <Route
              path="/dashboard/notifications"
              element={<Navigate to="/user?tab=notifications" replace />}
            />
            <Route
              path="/dashboard/account"
              element={<Navigate to="/user?tab=account" replace />}
            />
            {/* Deep /dashboard/* sub-pages redirect preserving path suffix under /user */}
            <Route
              path="/dashboard/ai-interview/*"
              element={<DashboardSubRedirect prefix="/user/ai-interview" />}
            />
            <Route
              path="/dashboard/mock-interview/*"
              element={<DashboardSubRedirect prefix="/user/mock-interview" />}
            />
            <Route
              path="/dashboard/ai-chat/*"
              element={<DashboardSubRedirect prefix="/user/ai-chat" />}
            />
            <Route
              path="/dashboard/questions/*"
              element={<DashboardSubRedirect prefix="/user/questions" />}
            />
            <Route
              path="/dashboard/practice/*"
              element={<DashboardSubRedirect prefix="/user/practice" />}
            />
            <Route
              path="/dashboard/community/*"
              element={<DashboardSubRedirect prefix="/user/community" />}
            />
            <Route
              path="/dashboard/feedback/*"
              element={<DashboardSubRedirect prefix="/user/feedback" />}
            />

            {/* Mentor Dashboard — ChromeTabs shell at /mentor, sub-pages nested inside */}
            <Route element={<ProtectedRoute allowedRoles={["MENTOR"]} />}>
              <Route path="/mentor" element={<MentorDashboardPage />}>
                <Route path="sessions/room/:sessionId" element={<MentorSessionRoomPage />} />
                <Route path="sessions/:sessionId/feedback" element={<WriteFeedbackPage />} />
                <Route path="reviews/:id" element={<ReviewDetailPage />} />
                <Route path="students/:userId" element={<StudentDetailPage />} />
                <Route path="community/create" element={<CreatePostPage />} />
                <Route path="community/:postId/edit" element={<EditPostPage />} />
                <Route path="community/:postId" element={<PostDetailPage />} />
              </Route>
            </Route>
            {/* Backward-compat redirects for /mentor-dashboard/* URLs */}
            <Route path="/mentor-dashboard" element={<Navigate to="/mentor" replace />} />
            <Route
              path="/mentor-dashboard/overview"
              element={<Navigate to="/mentor?tab=overview" replace />}
            />
            <Route
              path="/mentor-dashboard/sessions"
              element={<Navigate to="/mentor?tab=sessions" replace />}
            />
            <Route
              path="/mentor-dashboard/students"
              element={<Navigate to="/mentor?tab=students" replace />}
            />
            <Route
              path="/mentor-dashboard/reviews"
              element={<Navigate to="/mentor?tab=reviews" replace />}
            />
            <Route
              path="/mentor-dashboard/feedback"
              element={<Navigate to="/mentor?tab=feedback" replace />}
            />
            <Route
              path="/mentor-dashboard/notifications"
              element={<Navigate to="/mentor?tab=notifications" replace />}
            />
            <Route
              path="/mentor-dashboard/account"
              element={<Navigate to="/mentor?tab=account" replace />}
            />
            <Route
              path="/mentor-dashboard/community"
              element={<Navigate to="/mentor?tab=community" replace />}
            />

            {/* Admin Management routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
            {/* Redirect routes for backward compatibility - redirect /admin/* to /admin?tab=* */}
            <Route
              path="/admin/dashboard"
              element={<Navigate to="/admin?tab=dashboard" replace />}
            />
            <Route path="/admin/mentors" element={<Navigate to="/admin?tab=mentors" replace />} />
            <Route path="/admin/users" element={<Navigate to="/admin?tab=users" replace />} />
            <Route path="/admin/sessions" element={<Navigate to="/admin?tab=sessions" replace />} />
            <Route path="/admin/reviews" element={<Navigate to="/admin?tab=reviews" replace />} />
            <Route path="/admin/feedback" element={<Navigate to="/admin?tab=feedback" replace />} />
            <Route
              path="/admin/notifications"
              element={<Navigate to="/admin?tab=notifications" replace />}
            />
            <Route
              path="/admin/questionCategories"
              element={<Navigate to="/admin?tab=questionCategories" replace />}
            />
            <Route
              path="/admin/questionMajors"
              element={<Navigate to="/admin?tab=questionMajors" replace />}
            />
            <Route
              path="/admin/practiceSets"
              element={<Navigate to="/admin?tab=practiceSets" replace />}
            />
            {/* Backward compatibility redirect */}
            <Route
              path="/admin/questionSets"
              element={<Navigate to="/admin?tab=practiceSets" replace />}
            />
            <Route
              path="/admin/practiceQuestions"
              element={<Navigate to="/admin?tab=practiceQuestions" replace />}
            />
            <Route path="/admin/quizSets" element={<Navigate to="/admin?tab=quizSets" replace />} />
            <Route path="/admin/posts" element={<Navigate to="/admin?tab=posts" replace />} />
            <Route
              path="/admin/candidateProfiles"
              element={<Navigate to="/admin?tab=candidateProfiles" replace />}
            />

            {/* Staff Dashboard routes */}
            <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
              <Route path="/staff" element={<StaffDashboardPage />} />
              <Route path="/staff/reviews" element={<ReviewModerationPage />} />
              <Route path="/staff/feedback" element={<FeedbackModerationPage />} />
              <Route path="/staff/posts" element={<PostModerationPage />} />
              <Route path="/staff/content" element={<ContentModerationPage />} />
              <Route path="/staff/mentor-applications" element={<MentorApplicationsPage />} />
              <Route path="/staff/sessions" element={<SessionProcessingPage />} />
              <Route path="/staff/support" element={<UserSupportPage />} />
            </Route>

            {/* Error pages */}
            <Route path="/error/401" element={<UnauthorizedPage />} />
            <Route path="/error/403" element={<ForbiddenPage />} />
            <Route path="/error/404" element={<NotFoundPage />} />
            <Route path="/error/500" element={<ServerErrorPage />} />
            <Route path="/error/503" element={<ServiceUnavailablePage />} />
            <Route path="/error/504" element={<GatewayTimeoutPage />} />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
