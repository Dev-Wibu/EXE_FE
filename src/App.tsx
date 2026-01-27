import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout, MentorDashboardLayout, UserDashboardLayout } from "@/components/layouts";
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
  GivenFeedbackListPage,
  MentorAccountPage,
  MentorDashboardPage,
  MentorNotificationsPage,
  MentorOverviewPage,
  MentorReviewsPage,
  MentorSessionsPage,
  ReviewDetailPage,
  StudentDetailPage,
  StudentsListPage,
  WriteFeedbackPage,
} from "@/pages/Mentor";
import { FeedbackModerationPage, ReviewModerationPage, StaffDashboardPage } from "@/pages/Staff";
import {
  AccountPage,
  AIChatConversationPage,
  AIChatListPage,
  AIInterviewListPage,
  AIInterviewPaymentPage,
  AIInterviewPaymentRedirectPage,
  AIInterviewPaymentSuccessPage,
  AIInterviewResultPage,
  AIInterviewSessionPage,
  FeedbackDetailPage,
  MockInterviewListPage,
  MockInterviewPaymentRedirectPage,
  MockInterviewPaymentSuccessPage,
  MockInterviewSchedulePage,
  MockInterviewSelectMentorPage,
  OverviewPage,
  QuestionDetailPage,
  QuestionListPage,
  SessionDetailPage,
  SessionHistoryPage,
  UserDashboardPage,
  UserFeedbackListPage,
  UserNotificationsPage,
  WriteReviewPage,
} from "@/pages/User";

function App() {
  return (
    <QueryProvider>
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

          {/* Auth routes with AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Auth routes without layout (full page) */}
          <Route path="/select-role" element={<SelectRolePage />} />
          <Route path="/mentor-register" element={<MentorRegisterPage />} />
          <Route path="/waiting-accept" element={<WaitingAcceptMentorPage />} />

          {/* User Dashboard routes with UserDashboardLayout */}
          <Route element={<UserDashboardLayout />}>
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/dashboard/ai-interview" element={<AIInterviewListPage />} />
            <Route path="/dashboard/ai-interview/payment" element={<AIInterviewPaymentPage />} />
            <Route
              path="/dashboard/ai-interview/payment-redirect"
              element={<AIInterviewPaymentRedirectPage />}
            />
            <Route
              path="/dashboard/ai-interview/payment-success"
              element={<AIInterviewPaymentSuccessPage />}
            />
            <Route path="/dashboard/ai-interview/session" element={<AIInterviewSessionPage />} />
            <Route path="/dashboard/ai-interview/result/:id" element={<AIInterviewResultPage />} />

            {/* Mock Interview routes */}
            <Route path="/dashboard/mock-interview" element={<MockInterviewListPage />} />
            <Route
              path="/dashboard/mock-interview/select-mentor"
              element={<MockInterviewSelectMentorPage />}
            />
            <Route
              path="/dashboard/mock-interview/schedule"
              element={<MockInterviewSchedulePage />}
            />
            <Route />
            <Route
              path="/dashboard/mock-interview/payment-redirect"
              element={<MockInterviewPaymentRedirectPage />}
            />
            <Route
              path="/dashboard/mock-interview/payment-success"
              element={<MockInterviewPaymentSuccessPage />}
            />
            <Route path="/dashboard/mock-interview/history" element={<SessionHistoryPage />} />
            <Route
              path="/dashboard/mock-interview/history/:sessionId"
              element={<SessionDetailPage />}
            />
            <Route
              path="/dashboard/mock-interview/history/:sessionId/review"
              element={<WriteReviewPage />}
            />

            {/* AI Chat routes */}
            <Route path="/dashboard/ai-chat" element={<AIChatListPage />} />
            <Route path="/dashboard/ai-chat/:id" element={<AIChatConversationPage />} />

            {/* Question Bank routes */}
            <Route path="/dashboard/questions" element={<QuestionListPage />} />
            <Route path="/dashboard/questions/:id" element={<QuestionDetailPage />} />

            {/* Feedback routes */}
            <Route path="/dashboard/feedback" element={<UserFeedbackListPage />} />
            <Route path="/dashboard/feedback/:id" element={<FeedbackDetailPage />} />

            {/* Account routes */}
            <Route path="/dashboard/account" element={<AccountPage />} />

            {/* Notifications routes */}
            <Route path="/dashboard/notifications" element={<UserNotificationsPage />} />
          </Route>

          {/* User Dashboard with Chrome Tabs (alternative route) */}
          <Route path="/user" element={<UserDashboardPage />} />
          {/* Redirect routes for User Dashboard tabs */}
          <Route path="/user/overview" element={<Navigate to="/user?tab=overview" replace />} />
          <Route
            path="/user/mock-interview"
            element={<Navigate to="/user?tab=mockInterview" replace />}
          />
          <Route
            path="/user/interview-history"
            element={<Navigate to="/user?tab=interviewHistory" replace />}
          />
          <Route path="/user/feedback" element={<Navigate to="/user?tab=feedback" replace />} />
          <Route
            path="/user/ai-interview"
            element={<Navigate to="/user?tab=aiInterview" replace />}
          />
          <Route path="/user/ai-chat" element={<Navigate to="/user?tab=aiChat" replace />} />
          <Route path="/user/questions" element={<Navigate to="/user?tab=questions" replace />} />
          <Route
            path="/user/notifications"
            element={<Navigate to="/user?tab=notifications" replace />}
          />
          <Route path="/user/account" element={<Navigate to="/user?tab=account" replace />} />

          {/* Mentor Dashboard routes with MentorDashboardLayout */}
          <Route element={<MentorDashboardLayout />}>
            <Route path="/mentor" element={<MentorOverviewPage />} />
            <Route path="/mentor/account" element={<MentorAccountPage />} />
            <Route path="/mentor/notifications" element={<MentorNotificationsPage />} />

            {/* Mentor Sessions & Feedback routes */}
            <Route path="/mentor/sessions" element={<MentorSessionsPage />} />
            <Route path="/mentor/sessions/:sessionId/feedback" element={<WriteFeedbackPage />} />

            {/* Mentor Reviews routes */}
            <Route path="/mentor/reviews" element={<MentorReviewsPage />} />
            <Route path="/mentor/reviews/:id" element={<ReviewDetailPage />} />

            {/* Mentor Feedback routes */}
            <Route path="/mentor/feedback" element={<GivenFeedbackListPage />} />

            {/* Mentor Students routes */}
            <Route path="/mentor/students" element={<StudentsListPage />} />
            <Route path="/mentor/students/:userId" element={<StudentDetailPage />} />
          </Route>

          {/* Mentor Dashboard with Chrome Tabs (alternative route) */}
          <Route path="/mentor-dashboard" element={<MentorDashboardPage />} />
          {/* Redirect routes for Mentor Dashboard tabs */}
          <Route
            path="/mentor-dashboard/overview"
            element={<Navigate to="/mentor-dashboard?tab=overview" replace />}
          />
          <Route
            path="/mentor-dashboard/sessions"
            element={<Navigate to="/mentor-dashboard?tab=sessions" replace />}
          />
          <Route
            path="/mentor-dashboard/students"
            element={<Navigate to="/mentor-dashboard?tab=students" replace />}
          />
          <Route
            path="/mentor-dashboard/reviews"
            element={<Navigate to="/mentor-dashboard?tab=reviews" replace />}
          />
          <Route
            path="/mentor-dashboard/feedback"
            element={<Navigate to="/mentor-dashboard?tab=feedback" replace />}
          />
          <Route
            path="/mentor-dashboard/notifications"
            element={<Navigate to="/mentor-dashboard?tab=notifications" replace />}
          />
          <Route
            path="/mentor-dashboard/account"
            element={<Navigate to="/mentor-dashboard?tab=account" replace />}
          />

          {/* Admin Management routes */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          {/* Redirect routes for backward compatibility - redirect /admin/* to /admin?tab=* */}
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
            path="/admin/questionSets"
            element={<Navigate to="/admin?tab=questionSets" replace />}
          />

          {/* Staff Dashboard routes */}
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/reviews" element={<ReviewModerationPage />} />
          <Route path="/staff/feedback" element={<FeedbackModerationPage />} />

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
  );
}

export default App;
