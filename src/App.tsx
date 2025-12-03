import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthLayout, UserDashboardLayout } from "@/components/layouts";
import {
  LoginPage,
  MentorRegisterPage,
  SelectRolePage,
  SignupPage,
  WaitingAcceptMentorPage,
} from "@/pages/Auth";
import { HomePage } from "@/pages/Homepage";
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
  MockInterviewConfirmPage,
  MockInterviewListPage,
  MockInterviewPaymentRedirectPage,
  MockInterviewPaymentSuccessPage,
  MockInterviewSchedulePage,
  MockInterviewSelectMentorPage,
  OverviewPage,
  QuestionDetailPage,
  QuestionListPage,
} from "@/pages/User";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />

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
          <Route path="/dashboard/mock-interview/confirm" element={<MockInterviewConfirmPage />} />
          <Route
            path="/dashboard/mock-interview/payment-redirect"
            element={<MockInterviewPaymentRedirectPage />}
          />
          <Route
            path="/dashboard/mock-interview/payment-success"
            element={<MockInterviewPaymentSuccessPage />}
          />

          {/* AI Chat routes */}
          <Route path="/dashboard/ai-chat" element={<AIChatListPage />} />
          <Route path="/dashboard/ai-chat/:id" element={<AIChatConversationPage />} />

          {/* Question Bank routes */}
          <Route path="/dashboard/questions" element={<QuestionListPage />} />
          <Route path="/dashboard/questions/:id" element={<QuestionDetailPage />} />

          {/* Account routes */}
          <Route path="/dashboard/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
