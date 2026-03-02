import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ChatPanel } from "./ChatPanel";
import { InterviewHeader } from "./InterviewHeader";
import { useAIInterviewSession } from "./useAIInterviewSession";

export function AIInterviewSessionPage() {
  const session = useAIInterviewSession();

  // ---- Error state: missing session key ----
  if (!session.sessionKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không tìm thấy phiên phỏng vấn</AlertTitle>
          <AlertDescription>Thiếu session key. Vui lòng tạo phiên phỏng vấn mới.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ---- Error state: start failed ----
  if (session.startError) {
    const errorBody =
      (session.startError as { message?: string })?.message ??
      JSON.stringify(session.startError).slice(0, 200);
    const isExpired =
      errorBody.includes("not found") || errorBody.includes("expired") || errorBody.includes("404");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isExpired ? "Phiên phỏng vấn không tồn tại" : "Lỗi khởi động phỏng vấn"}
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              {isExpired
                ? "Phiên phỏng vấn đã hết hạn hoặc không tồn tại. Vui lòng tạo phiên mới."
                : "Không thể bắt đầu phiên phỏng vấn. Vui lòng thử lại."}
            </p>
            {import.meta.env.DEV && errorBody && (
              <p className="text-xs break-all opacity-70">Chi tiết: {errorBody}</p>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => session.navigate("/user?tab=aiInterview")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
          <Button
            onClick={() => session.navigate("/user/ai-interview/setup")}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            Tạo phỏng vấn mới
          </Button>
        </div>
      </div>
    );
  }

  // ---- Loading state ----
  if (session.isStarting && session.messages.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#0047AB]" />
          <p className="text-muted-foreground font-medium">Đang khởi động phỏng vấn...</p>
        </div>
      </div>
    );
  }

  // ---- Main chat UI ----
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <InterviewHeader
        phaseName={session.currentPhase}
        questionIndex={session.currentQuestionIndex}
        totalQuestions={session.totalQuestions}
        finished={session.interviewFinished}
        isTTSSupported={session.isTTSSupported}
        isMuted={session.isMuted}
        onToggleMute={session.toggleMute}
        onBack={session.handleNavigateBack}
      />
      <ChatPanel
        messages={session.messages}
        userAvatarUrl={session.user?.avatarUrl ?? undefined}
        isTTSSupported={session.isTTSSupported}
        onToggleSpeak={session.handleToggleSpeak}
        speakingId={session.speakingId}
        isEvaluating={session.isEvaluating}
        isSubmitting={session.isSubmitting}
        hasStarted={session.hasStarted}
        messagesEndRef={session.messagesEndRef}
        interviewFinished={session.interviewFinished}
        sessionExpiredMidway={session.sessionExpiredMidway}
        onNavigateToList={session.handleNavigateBack}
        onNavigateToSetup={() => session.navigate("/user/ai-interview/setup")}
        onViewResults={session.handleViewResults}
        onSendAnswer={session.handleSendAnswer}
        isListening={session.isListening}
        interimTranscript={session.interimTranscript}
        isSpeechSupported={session.isSpeechRecognitionSupported}
        chatInputValue={session.chatInputValue}
        onChatInputChange={session.setChatInputValue}
        onStartListening={session.startListening}
        onStopListening={session.stopListening}
      />
    </div>
  );
}
