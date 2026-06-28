import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  useQuizConfig,
  useQuizState,
  useSubmitQuiz,
  type QuizQuestion,
} from "@/hooks/useApplicationQuiz";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

type QuizPhase = "loading" | "intro" | "quiz" | "review" | "submitting" | "result";

// ============================================================
// Timer Component
// ============================================================

function QuizTimer({
  timeLimitSeconds,
  onTimeUp,
  isPaused,
}: {
  timeLimitSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}) {
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percentage = (remaining / timeLimitSeconds) * 100;
  const isLow = remaining <= 60; // Less than 1 minute

  return (
    <div className="flex items-center gap-3">
      <Clock className={cn("h-4 w-4", isLow ? "animate-pulse text-red-500" : "text-slate-500")} />
      <div className="min-w-[80px]">
        <p
          className={cn(
            "font-mono text-sm font-bold",
            isLow ? "text-red-500" : "text-slate-700 dark:text-slate-300"
          )}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>
      <div className="w-24">
        <Progress
          value={percentage}
          className={cn("h-2", isLow ? "[&>div]:bg-red-500" : "[&>div]:bg-[#0047AB]")}
        />
      </div>
    </div>
  );
}

// ============================================================
// Question Card Component
// ============================================================

function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswer,
  onSelectAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  showReview = false,
  isCorrect,
}: {
  questionNumber: number;
  totalQuestions: number;
  question: QuizQuestion;
  selectedAnswer: string | null;
  onSelectAnswer: (_answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  showReview?: boolean;
  isCorrect?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-[#0047AB]/10 text-[#0047AB]">
          Câu hỏi {questionNumber} / {totalQuestions}
        </Badge>
        {showReview && isCorrect !== undefined && (
          <Badge
            className={cn(
              isCorrect
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            )}>
            {isCorrect ? "Đúng" : "Sai"}
          </Badge>
        )}
      </div>

      {/* Question Text */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-lg leading-relaxed font-medium text-slate-900 dark:text-slate-100">
          {question.questionText}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option: string, idx: number) => {
          const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = selectedAnswer === optionLetter;
          const isCorrectOption = question.correctAnswer === optionLetter;
          const showCorrect = showReview && isCorrectOption;
          const showWrong = showReview && isSelected && !isCorrectOption;

          return (
            <button
              key={idx}
              onClick={() => !showReview && onSelectAnswer(optionLetter)}
              disabled={showReview}
              className={cn(
                "w-full rounded-lg border-2 p-4 text-left transition-all",
                "hover:border-[#0047AB] hover:bg-[#0047AB]/5",
                isSelected &&
                  !showReview &&
                  "border-[#0047AB] bg-[#0047AB]/10 ring-2 ring-[#0047AB]/20",
                showCorrect &&
                  "border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20",
                showWrong && "border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-900/20",
                !isSelected &&
                  !showCorrect &&
                  !showWrong &&
                  "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              )}>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                    isSelected && !showReview && "border-[#0047AB] bg-[#0047AB] text-white",
                    showCorrect && "border-green-500 bg-green-500 text-white",
                    showWrong && "border-red-500 bg-red-500 text-white",
                    !isSelected &&
                      !showCorrect &&
                      !showWrong &&
                      "border-slate-300 text-slate-500 dark:border-slate-600"
                  )}>
                  {optionLetter}
                </div>
                <span
                  className={cn(
                    "flex-1 text-base",
                    isSelected && !showReview && "font-medium text-[#0047AB]",
                    showCorrect && "font-medium text-green-700 dark:text-green-300",
                    showWrong && "font-medium text-red-700 dark:text-red-300",
                    !isSelected &&
                      !showCorrect &&
                      !showWrong &&
                      "text-slate-700 dark:text-slate-300"
                  )}>
                  {option}
                </span>
                {showReview && isCorrectOption && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {showReview && showWrong && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onPrevious} disabled={isFirst} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Câu trước
        </Button>
        <Button
          onClick={onNext}
          className={cn("gap-2 bg-[#0047AB] hover:bg-[#003d91]", !selectedAnswer && "opacity-50")}>
          {isLast ? "Xem lại" : "Câu tiếp theo"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Result Summary Component
// ============================================================

function QuizResultSummary({
  results,
  score,
  maxScore,
  correctCount,
  totalQuestions,
  onBack,
}: {
  results: Array<{
    questionText: string;
    selectedAnswer: string | null;
    correctAnswer: string | null;
    isCorrect: boolean;
  }>;
  score: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  onBack?: () => void;
}) {
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const isPass = percentage >= 50;

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="overflow-hidden border-0">
        <div
          className={cn(
            "p-8 text-center",
            isPass
              ? "bg-gradient-to-br from-green-500 to-green-600"
              : "bg-gradient-to-br from-red-500 to-red-600"
          )}>
          <div className="mb-2 text-sm font-medium tracking-wider text-white/80 uppercase">
            Kết quả Quiz
          </div>
          <div className="mb-4 text-6xl font-bold text-white">
            {score}
            <span className="text-3xl font-normal text-white/70">/{maxScore}</span>
          </div>
          <div className="text-2xl font-semibold text-white">{percentage}%</div>
          <div className="mt-2 text-white/80">
            {correctCount}/{totalQuestions} câu đúng
          </div>
          <div className="mt-4">
            {isPass ? (
              <Badge className="bg-white text-green-700 hover:bg-white/90">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Đậu
              </Badge>
            ) : (
              <Badge className="bg-white text-red-700 hover:bg-white/90">
                <XCircle className="mr-1 h-4 w-4" />
                Tạch
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Chi tiết từng câu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-4",
                result.isCorrect
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              )}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Câu {idx + 1}: {result.questionText}
                </span>
                {result.isCorrect ? (
                  <Check className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                )}
              </div>
              {!result.isCorrect && result.correctAnswer && (
                <div className="mt-2 text-xs text-slate-500">
                  <span className="font-medium">Đáp án đúng: </span>
                  <span className="font-semibold text-green-600">
                    {result.correctAnswer}. {result.questionText}
                  </span>
                </div>
              )}
              {result.selectedAnswer && (
                <div className="mt-1 text-xs text-slate-500">
                  <span className="font-medium">Bạn chọn: </span>
                  <span
                    className={cn(
                      "font-semibold",
                      result.isCorrect ? "text-green-600" : "text-red-600"
                    )}>
                    {result.selectedAnswer}.
                  </span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1 gap-2">
            Quay lại
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Review Mode (before submitting)
// ============================================================

function QuizReview({
  answers,
  questions,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  answers: Record<number, string>;
  questions: QuizQuestion[];
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Xem lại câu trả lời</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600">{answeredCount}</div>
              <div className="text-sm text-slate-500">Đã trả lời</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20">
              <div className="text-2xl font-bold text-amber-600">{unansweredCount}</div>
              <div className="text-sm text-slate-500">Chưa trả lời</div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Danh sách câu hỏi
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_q, idx) => {
                const hasAnswer = answers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-lg border-2 text-sm font-medium transition-colors",
                      hasAnswer
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    )}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning */}
          {unansweredCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bạn còn {unansweredCount} câu chưa trả lời. Bạn có muốn nộp bài không?
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 gap-2" disabled={isSubmitting}>
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || answeredCount === 0}
          className="flex-1 gap-2 bg-[#0047AB] hover:bg-[#003d91]">
          {isSubmitting ? (
            <>
              <Spinner size="sm" tone="white" />
              Đang nộp...
            </>
          ) : (
            <>
              Nộp bài
              <Check className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Main Quiz Page Component
// ============================================================

export function ApplicationQuizPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const applicationId = parseInt(params.appId ?? "0", 10);
  const roundId = parseInt(params.roundId ?? "0", 10);

  // Get JD ID from URL params (passed from ApplicationHistoryPage)
  const jdId = parseInt(searchParams.get("jdId") ?? "0", 10);

  // Quiz phase state
  const [phase, setPhase] = useState<QuizPhase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Quiz state persistence
  const { saveQuizState, clearQuizState, recoverFromUrl } = useQuizState();

  // Fetch quiz config
  const {
    data: quizConfig,
    isLoading: isLoadingConfig,
    error: configError,
  } = useQuizConfig(jdId, roundId);

  // Submit mutation
  const { mutateAsync: submitQuiz, isPending: isSubmitting } = useSubmitQuiz({
    onSuccess: () => {
      clearQuizState();
      setPhase("result");
    },
  });

  // Questions from config
  const questions = useMemo(() => quizConfig?.questions ?? [], [quizConfig]);

  // Determine phase on load — use layout effect to avoid cascading renders from multiple setState calls
  useEffect(() => {
    if (isLoadingConfig) {
      setPhase("loading");
      return;
    }

    if (configError || !quizConfig || questions.length === 0) {
      setPhase("loading");
      return;
    }

    // Try to recover state from URL
    const recovered = recoverFromUrl();
    if (recovered && Object.keys(recovered.answers).length > 0) {
      setAnswers(recovered.answers);
      setCurrentIndex(recovered.currentIndex);
      setPhase("quiz");
    } else {
      setPhase("intro");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingConfig, configError, quizConfig, questions.length]);

  // Persist state changes to URL
  useEffect(() => {
    if (phase === "quiz") {
      const params = new URLSearchParams(searchParams);
      params.set("answers", JSON.stringify(answers));
      params.set("idx", String(currentIndex));
      setSearchParams(params, { replace: true });

      // Also save to sessionStorage for backup
      saveQuizState({
        answers,
        currentIndex,
        startedAt: new Date().toISOString(),
        timeLimitSeconds: (quizConfig?.timeLimitMinutes ?? 30) * 60,
      });
    }
  }, [answers, currentIndex, phase, quizConfig, saveQuizState]);

  // Handle answer selection
  const handleSelectAnswer = useCallback(
    (answer: string) => {
      setAnswers((prev) => ({
        ...prev,
        [currentIndex]: answer,
      }));
    },
    [currentIndex]
  );

  // Navigation
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Start quiz
  const handleStartQuiz = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setPhase("quiz");

    // Clear old state
    const params = new URLSearchParams(searchParams);
    params.delete("answers");
    params.delete("idx");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Go to review
  const handleReview = useCallback(() => {
    setPhase("review");
  }, []);

  // Go back to quiz from review
  const handleBackToQuiz = useCallback(() => {
    setPhase("quiz");
  }, []);

  // Submit quiz
  const handleSubmit = useCallback(async () => {
    // Build answers array in order
    const answersArray = questions.map((_, idx) => answers[idx] ?? "");

    await submitQuiz({
      applicationId,
      answers: answersArray,
    });
  }, [applicationId, answers, questions, submitQuiz]);

  // Time's up - auto submit
  const handleTimeUp = useCallback(() => {
    toast.warning("Hết giờ! Bài sẽ được nộp tự động.");
    handleSubmit();
  }, [handleSubmit]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (phase === "quiz") {
      // Save current state and go back
      navigate(-1);
    } else if (phase === "review") {
      setPhase("quiz");
    } else if (phase === "result") {
      navigate("/user?tab=applicationHistory");
    } else {
      navigate("/user?tab=applicationHistory");
    }
  }, [phase, navigate]);

  // Loading state
  if (phase === "loading" || isLoadingConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-10 w-10" />
          <p className="text-slate-500">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!quizConfig || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h2 className="mb-2 text-lg font-semibold">Không tìm thấy quiz</h2>
            <p className="mb-6 text-sm text-slate-500">
              Không có câu hỏi quiz nào cho vòng thi này. Vui lòng quay lại.
            </p>
            <Button
              onClick={() => navigate("/user?tab=applicationHistory")}
              className="gap-2 bg-[#0047AB]">
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeLimitSeconds = (quizConfig?.timeLimitMinutes ?? 30) * 60;
  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {quizConfig?.roundName ?? "Quiz"}
              </h1>
              <p className="text-xs text-slate-500">
                {questions.length} câu hỏi • {quizConfig?.timeLimitMinutes ?? 30} phút
              </p>
            </div>
          </div>
          {phase === "quiz" && (
            <QuizTimer timeLimitSeconds={timeLimitSeconds} onTimeUp={handleTimeUp} />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Intro Phase */}
          {phase === "intro" && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0047AB]/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-[#0047AB]">
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 17h.01" />
                    </svg>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Bài Quiz: {quizConfig?.roundName ?? "Quiz"}
                  </h2>
                  <p className="mx-auto max-w-md text-slate-600 dark:text-slate-400">
                    {questions.length} câu hỏi • Thời gian: {quizConfig?.timeLimitMinutes ?? 30}{" "}
                    phút • Điểm tối đa: {quizConfig?.maxScore ?? 100}
                  </p>
                </div>

                {quizConfig?.instruction && (
                  <div className="mb-6 rounded-lg bg-slate-100 p-4 text-left dark:bg-slate-800">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {quizConfig.instruction}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleStartQuiz}
                    size="lg"
                    className="w-full gap-2 bg-[#0047AB] text-base hover:bg-[#003d91]">
                    <Check className="h-5 w-5" />
                    Bắt đầu làm bài
                  </Button>
                  <p className="text-xs text-slate-400">
                    * Bài làm sẽ được lưu tự động. Bạn có thể tắt và quay lại trước khi hết giờ.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quiz Phase */}
          {phase === "quiz" && currentQuestion && (
            <QuestionCard
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              question={currentQuestion}
              selectedAnswer={answers[currentIndex] ?? null}
              onSelectAnswer={handleSelectAnswer}
              onNext={currentIndex === questions.length - 1 ? handleReview : handleNext}
              onPrevious={handlePrevious}
              isFirst={currentIndex === 0}
              isLast={currentIndex === questions.length - 1}
            />
          )}

          {/* Review Phase */}
          {phase === "review" && (
            <QuizReview
              answers={answers}
              questions={questions}
              onSubmit={handleSubmit}
              onBack={handleBackToQuiz}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Result Phase */}
          {phase === "result" && (
            <QuizResultSummary
              results={questions.map((q, idx) => ({
                questionText: q.questionText,
                selectedAnswer: answers[idx] ?? null,
                correctAnswer: q.correctAnswer ?? null,
                isCorrect: answers[idx] === q.correctAnswer,
              }))}
              score={Math.round(
                (Object.keys(answers).filter(
                  (idx) => answers[parseInt(idx)] === questions[parseInt(idx)]?.correctAnswer
                ).length /
                  questions.length) *
                  100
              )}
              maxScore={quizConfig?.maxScore ?? 100}
              correctCount={
                Object.keys(answers).filter(
                  (idx) => answers[parseInt(idx)] === questions[parseInt(idx)]?.correctAnswer
                ).length
              }
              totalQuestions={questions.length}
              onBack={() => navigate("/user?tab=applicationHistory")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
