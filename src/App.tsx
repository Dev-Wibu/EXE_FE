import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthLayout } from "@/components/layouts";
import { UserAccountLayout } from "@/components/layouts/UserAccountLayout";
import {
  ProtectedRoute,
  PublicOnlyRoute,
  ScrollToTop,
  SessionExpiryGuard,
} from "@/components/shared";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/contexts/QueryProvider";
import { AdminDashboardPage } from "@/pages/Admin";
import { ApplicationGradingDetailPage } from "@/pages/Admin/ApplicationGrading";
import {
  LoginPage,
  MentorRegisterPage,
  SelectRolePage,
  SignupPage,
  WaitingAcceptMentorPage,
} from "@/pages/Auth";
import { PlaygroundPage } from "@/pages/Dev/Playground/PlaygroundPage";
import { CompanyDetailPage, CompanySearchPage, JobDescriptionDetailPage } from "@/pages/Enterprise";
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
  MentorSessionDetailPage,
  MentorSessionRoomPage,
  ReviewDetailPage,
  StudentDetailPage,
  WriteFeedbackPage,
} from "@/pages/Mentor";
import { PaymentCancelPage, PaymentSuccessPage } from "@/pages/Payment";
import {
  FeedbackModerationPage,
  MentorApplicationsPage,
  PostModerationPage,
  ReviewModerationPage,
  SessionProcessingPage,
  StaffDashboardPage,
} from "@/pages/Staff";
import {
  AccountPage,
  AIInterviewResultPage,
  AIInterviewSessionPage,
  AIInterviewSetupPage,
  ApplicationAIInterviewPage,
  ApplicationHistoryPage,
  ApplicationMentorReviewPage,
  ApplicationQuizPage,
  BookingSuccessPage,
  FeedbackDetailPage,
  MentorDetailPage,
  MockInterviewSchedulePage,
  MockInterviewSelectMentorPage,
  PracticeSetDetailPage,
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

function QueryHashRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

function PublicScrollToTopButton() {
  const { pathname } = useLocation();
  const isDashboardRoute = ["/user", "/mentor", "/admin", "/staff"].some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isDashboardRoute) {
    return null;
  }

  return <ScrollToTopButton threshold={600} />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <Toaster />
        <BrowserRouter>
          <SessionExpiryGuard />
          <ScrollToTop />
          <PublicScrollToTopButton />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            <Route path="/success" element={<PaymentSuccessPage />} />
            <Route path="/cancel" element={<PaymentCancelPage />} />
            <Route path="/auth/callback" element={<QueryHashRedirect to="/login" />} />
            <Route path="/oauth2/callback" element={<QueryHashRedirect to="/login" />} />

            {/* Questions pages (public) */}
            <Route path="/questions/bank" element={<QuestionBankPage />} />
            <Route path="/questions/tips" element={<InterviewTipsPage />} />

            {/* Enterprise Simulation pages (public) */}
            <Route path="/enterprise/companies" element={<CompanySearchPage />} />
            <Route path="/enterprise/company/:id" element={<CompanyDetailPage />} />
            <Route path="/enterprise/job/:id" element={<JobDescriptionDetailPage />} />

            {/* Features pages (public) */}
            <Route path="/features/ai-interview" element={<AIInterviewFeaturePage />} />
            <Route path="/features/mentor-interview" element={<MentorInterviewFeaturePage />} />

            {/* Resources pages (public) */}
            <Route path="/resources/faq" element={<FAQPage />} />
            <Route path="/resources/blog" element={<BlogPage />} />
            <Route
              path="/dev/playground"
              element={import.meta.env.DEV ? <PlaygroundPage /> : <NotFoundPage />}
            />

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
                  path="mock-interview/history/:sessionId/feedback"
                  element={<WriteReviewPage />}
                />
                <Route path="mock-interview/history/:sessionId" element={<SessionDetailPage />} />
                <Route
                  path="practice/session/:sessionId/:practiceSetId/quiz/:quizId/result"
                  element={<QuizResultPage />}
                />
                <Route
                  path="practice/session/:sessionId/:practiceSetId/quiz/:quizId"
                  element={<QuizPage />}
                />
                <Route path="practice/session/:sessionId" element={<PracticeSetDetailPage />} />
                <Route path="practice/:id" element={<PracticeSetDetailPage />} />
                <Route path="feedback/:id" element={<FeedbackDetailPage />} />
                <Route path="mentors/:mentorId" element={<MentorDetailPage />} />
                <Route path="application-history" element={<ApplicationHistoryPage />} />
              </Route>
            </Route>
            {/* Standalone account page — full page, no sidebar */}
            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route element={<UserAccountLayout />}>
                <Route path="/user/account" element={<AccountPage />} />
              </Route>
            </Route>

            {/* Quiz page — full page, no sidebar, outside ChromeTabs shell */}
            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route path="/user/quiz/:appId/round/:roundId" element={<ApplicationQuizPage />} />
            </Route>
            {/* Mentor Review — full page, no sidebar */}
            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route
                path="/user/application/:applicationId/mentor-review"
                element={<ApplicationMentorReviewPage />}
              />
            </Route>
            {/* AI Interview for Application — full page, no sidebar */}
            <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
              <Route
                path="/user/application/:applicationId/ai-interview"
                element={<ApplicationAIInterviewPage />}
              />
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
            <Route path="/dashboard/ai-chat" element={<Navigate to="/user" replace />} />
            <Route path="/dashboard/questions" element={<Navigate to="/user" replace />} />
            <Route
              path="/dashboard/practice"
              element={<Navigate to="/user?tab=practice" replace />}
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
            <Route path="/dashboard/ai-chat/*" element={<Navigate to="/user" replace />} />
            <Route path="/dashboard/questions/*" element={<Navigate to="/user" replace />} />
            <Route
              path="/dashboard/practice/*"
              element={<DashboardSubRedirect prefix="/user/practice" />}
            />
            <Route
              path="/dashboard/feedback/*"
              element={<DashboardSubRedirect prefix="/user/feedback" />}
            />

            {/* Mentor Dashboard — ChromeTabs shell at /mentor, sub-pages nested inside */}
            <Route element={<ProtectedRoute allowedRoles={["MENTOR"]} />}>
              <Route path="/mentor" element={<MentorDashboardPage />}>
                <Route path="sessions/:sessionId" element={<MentorSessionDetailPage />} />
                <Route path="sessions/room/:sessionId" element={<MentorSessionRoomPage />} />
                <Route path="sessions/:sessionId/review" element={<WriteFeedbackPage />} />
                <Route path="reviews/:id" element={<ReviewDetailPage />} />
                <Route path="students/:userId" element={<StudentDetailPage />} />
              </Route>
            </Route>
            {/* Backward-compat redirects for /mentor-dashboard/* URLs */}
            <Route path="/mentor-dashboard" element={<Navigate to="/mentor" replace />} />
            <Route
              path="/mentor-dashboard/homefeed"
              element={<Navigate to="/mentor?tab=homeFeed" replace />}
            />
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

            {/* Admin Management routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/companies/:companyId" element={<AdminDashboardPage />} />
              <Route
                path="/admin/application-grading/:appId"
                element={<ApplicationGradingDetailPage />}
              />
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
              path="/admin/companies"
              element={<Navigate to="/admin?tab=companies" replace />}
            />
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
              <Route path="/staff/mentor-applications" element={<MentorApplicationsPage />} />
              <Route path="/staff/sessions" element={<SessionProcessingPage />} />
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
