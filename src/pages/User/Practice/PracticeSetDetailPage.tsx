import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  buildPracticeQuizPath,
  buildPracticeQuizResultPath,
  buildPracticeSessionPath,
} from "@/lib/practice-quiz-route";
import { practiceSetItemManager, practiceSetManager, quizSetManager } from "@/services";
import type { PracticeSetItem } from "@/services/practice-set-item.manager";
import type { PracticeSet, PracticeSetResponse } from "@/services/practice-set.manager";
import type { QuizResponse, QuizSet } from "@/services/quiz-set.manager";
import { format, isSameDay } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  GraduationCap,
  History,
  Lightbulb,
  Lock,
  MessageCircle,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Parse dateNumber from practice set name: look for "7", "14", or "21". */
function parseDateNumber(name?: string): number {
  if (!name) return 14;
  if (name.includes("21")) return 21;
  if (name.includes("14")) return 14;
  if (name.includes("7")) return 7;
  return 14;
}
type DayStatus = "COMPLETED" | "IN_PROGRESS" | "LOCKED";
type ItemStatus = "DONE" | "NEXT" | "AVAILABLE" | "LOCKED";
const levelBadge: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
};

// ─── PracticeItemCard ────────────────────────────────────────────────────────

interface ItemCardProps {
  item: PracticeSetItem;
  index: number;
  status: ItemStatus;
  practiceSetId: string;
  sessionId?: number;
  lastQuizId?: number;
}
function PracticeItemCard({
  item,
  index,
  status,
  practiceSetId,
  sessionId,
  lastQuizId,
}: ItemCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const isDone = status === "DONE";
  const isNext = status === "NEXT";
  const isLocked = status === "LOCKED";
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${isLocked ? "opacity-50" : ""} ${isNext ? "border-[#0047AB] bg-blue-50/60 shadow-sm ring-1 ring-[#0047AB]/20 dark:bg-blue-950/20" : "border-border bg-card"}`}>
      {/* NEXT badge */}
      {isNext && (
        <div className="absolute -top-2.5 right-3">
          <Badge className="bg-[#0047AB] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            {t("common.next")}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          ) : isLocked ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <BookOpen className="h-4 w-4 text-[#0047AB]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-foreground text-sm leading-snug font-semibold">
              {item.practiceQuestion?.title ??
                t("general.question", {
                  var_0: index + 1,
                })}
            </p>
            <Badge
              className={`shrink-0 text-xs ${levelBadge[item.practiceQuestion?.level ?? ""] ?? "bg-gray-100 text-gray-700"}`}>
              {item.practiceQuestion?.level}
            </Badge>
          </div>

          {item.practiceQuestion?.content && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {item.practiceQuestion.content}
            </p>
          )}

          {/* Duration + action buttons */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {t("common.duration30mins")}
            </span>

            {!isLocked && (
              <>
                {item.practiceQuestion?.hint && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400"
                    onClick={() => setShowHint((v) => !v)}>
                    <Lightbulb className="h-3 w-3" />
                    {t("adminPracticequestionmanagement.suggest")}
                  </Button>
                )}
                {item.practiceQuestion?.answer && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400"
                    onClick={() => setShowAnswer((v) => !v)}>
                    <Eye className="h-3 w-3" />
                    {t("adminPracticequestionmanagement.answer")}
                  </Button>
                )}
                {isDone && lastQuizId && sessionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-6 gap-1 px-2 text-xs"
                    onClick={() =>
                      navigate(
                        buildPracticeQuizResultPath({
                          sessionId,
                          practiceSetId,
                          quizId: lastQuizId,
                        })
                      )
                    }>
                    {t("userPractice.review")}
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}

            {isLocked && (
              <span className="text-muted-foreground ml-auto text-xs">
                {t("general.notOpened")}
              </span>
            )}
          </div>

          {/* Hint */}
          {showHint && item.practiceQuestion?.hint && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {t("userPractice.suggest")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                {item.practiceQuestion.hint}
              </p>
            </div>
          )}

          {/* Answer */}
          {showAnswer && item.practiceQuestion?.answer && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t("common.answer")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
                {item.practiceQuestion.answer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SessionQuestionCard (used only in session/roadmap view) ────────────────

interface SessionItemCardProps {
  question: {
    questionId?: number;
    title?: string;
    content?: string;
    level?: string;
    answer?: string;
    hint?: string;
  };
  index: number;
  status: ItemStatus;
}
function SessionQuestionCard({ question, index, status }: SessionItemCardProps) {
  const { t } = useTranslation();
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const isDone = status === "DONE";
  const isNext = status === "NEXT";
  const isLocked = status === "LOCKED";
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${isLocked ? "opacity-50" : ""} ${isNext ? "border-[#0047AB] bg-blue-50/60 shadow-sm ring-1 ring-[#0047AB]/20 dark:bg-blue-950/20" : "border-border bg-card"}`}>
      {isNext && (
        <div className="absolute -top-2.5 right-3">
          <Badge className="bg-[#0047AB] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            {t("common.next")}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          ) : isLocked ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <BookOpen className="h-4 w-4 text-[#0047AB]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-foreground text-sm leading-snug font-semibold">
              {question.title ??
                t("general.question", {
                  var_0: index + 1,
                })}
            </p>
            <Badge
              className={`shrink-0 text-xs ${levelBadge[question.level ?? ""] ?? "bg-gray-100 text-gray-700"}`}>
              {question.level}
            </Badge>
          </div>

          {question.content && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{question.content}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {t("common.duration30mins")}
            </span>

            {!isLocked && (
              <>
                {question.hint && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400"
                    onClick={() => setShowHint((v) => !v)}>
                    <Lightbulb className="h-3 w-3" />
                    {t("adminPracticequestionmanagement.suggest")}
                  </Button>
                )}
                {question.answer && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400"
                    onClick={() => setShowAnswer((v) => !v)}>
                    <Eye className="h-3 w-3" />
                    {t("adminPracticequestionmanagement.answer")}
                  </Button>
                )}
              </>
            )}

            {isLocked && (
              <span className="text-muted-foreground ml-auto text-xs">
                {t("general.notOpened")}
              </span>
            )}
          </div>

          {showHint && question.hint && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {t("userPractice.suggest")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                {question.hint}
              </p>
            </div>
          )}

          {showAnswer && question.answer && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t("common.answer")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
                {question.answer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── QuizHistoryPopover ───────────────────────────────────────────────────────

interface QuizHistoryPopoverProps {
  quizHistory: QuizSet[];
  routePracticeSetId: string;
  sessionId?: number;
}
function QuizHistoryPopover({
  quizHistory,
  routePracticeSetId,
  sessionId,
}: QuizHistoryPopoverProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sorted = [...quizHistory].sort((a, b) => (b.quizId ?? 0) - (a.quizId ?? 0));
  const handleNavigateToQuiz = (quiz: QuizSet) => {
    if (!sessionId || !quiz.quizId) {
      toast.error(t("userPractice.cannotOpenTestBecausePractice"));
      return;
    }
    const targetPath = quiz.submitted
      ? buildPracticeQuizResultPath({
          sessionId,
          practiceSetId: routePracticeSetId,
          quizId: quiz.quizId,
        })
      : buildPracticeQuizPath({
          sessionId,
          practiceSetId: routePracticeSetId,
          quizId: quiz.quizId,
        });
    navigate(targetPath);
  };
  return (
    <PopoverContent className="w-72 p-0" align="start">
      <div className="border-b px-3 py-2">
        <p className="text-foreground text-xs font-semibold">{t("userPractice.testHistory")}</p>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {sorted.map((quiz) => (
          <button
            key={quiz.quizId}
            className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors"
            onClick={() => handleNavigateToQuiz(quiz)}>
            <span className="text-foreground truncate text-xs">
              {quiz.quizName ?? t("userPractice.quizWithId", { id: quiz.quizId })}
            </span>
            {quiz.submitted ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {quiz.score ?? 0} {t("userPractice.point")}
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#0047AB] dark:bg-blue-900/40 dark:text-blue-300">
                {t("common.notYetSubmitted")}
              </span>
            )}
          </button>
        ))}
      </div>
    </PopoverContent>
  );
}

// ─── SessionDayGroup (used only in session/roadmap view) ─────────────────────

interface SessionDayGroupProps {
  ps: PracticeSetResponse;
  dayNumber: number;
  dayStatus: DayStatus;
  isOpen: boolean;
  onToggle: () => void;
}
function SessionDayGroup({ ps, dayNumber, dayStatus, isOpen, onToggle }: SessionDayGroupProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState<QuizSet[]>(
    () =>
      ps.quizzes?.map((q) => ({
        quizId: q.quizId,
        quizName: q.quizName,
        submitted: q.submit,
      })) ?? []
  );
  const [isCreating, setIsCreating] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<{
    quizId: number;
    backUrl: string;
    items?: unknown[];
  } | null>(null);
  const handleCreateAiQuiz = async () => {
    if (!ps.id) return;
    setIsCreating(true);
    try {
      const res = await quizSetManager.createFullAi(ps.id);
      if (res.success && res.data) {
        const newQuizId = (res.data as QuizResponse).quizId;
        if (newQuizId) {
          toast.success(t("userPractice.aiTestCreated"));
          const backUrl = ps.interviewSessionId
            ? buildPracticeSessionPath(ps.interviewSessionId)
            : "/user?tab=practice";
          // Fetch full quiz data so history shows accurate info
          const quizDetail = await quizSetManager.getById(newQuizId);
          if (quizDetail.success && quizDetail.data) {
            setQuizHistory((prev) => [...prev, quizDetail.data!]);
          } else {
            setQuizHistory((prev) => [
              ...prev,
              {
                quizId: newQuizId,
                quizName: t("userPractice.aiQuizWithId", { id: newQuizId }),
                submitted: false,
              },
            ]);
          }
          // Show confirmation dialog
          setPendingQuiz({
            quizId: newQuizId,
            backUrl,
            items: (res.data as QuizResponse).items,
          });
        } else {
          toast.error(t("userPractice.unableToGetTestId"));
        }
      } else {
        toast.error(res.error ?? t("common.unableToCreateAiTest"));
      }
    } catch {
      toast.error(t("common.unableToCreateAiTest"));
    } finally {
      setIsCreating(false);
    }
  };
  const statusConfig: Record<
    DayStatus,
    {
      label: string;
      className: string;
    }
  > = {
    COMPLETED: {
      label: t("general.completed2"),
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    IN_PROGRESS: {
      label: t("userPractice.goingOn"),
      className: "bg-blue-100 text-[#0047AB] dark:bg-blue-900/40 dark:text-blue-300",
    },
    LOCKED: {
      label: t("userPractice.notOpen"),
      className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    },
  };
  const cfg = statusConfig[dayStatus];
  const questions = ps.questions ?? [];
  const getItemStatus = (localIdx: number): ItemStatus => {
    if (dayStatus === "COMPLETED") return "DONE";
    if (dayStatus === "IN_PROGRESS") return localIdx === 0 ? "NEXT" : "AVAILABLE";
    // LOCKED day: questions are visible but not actionable
    return "AVAILABLE";
  };
  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div
          className={`bg-card rounded-xl border shadow-sm ${dayStatus === "IN_PROGRESS" ? "border-[#0047AB]/40" : dayStatus === "COMPLETED" ? "border-emerald-200 dark:border-emerald-900/40" : "border-border"}`}>
          <div className="flex items-center gap-3 px-4 py-3">
            <h2 className="text-foreground text-base font-bold">
              {ps.practiceSetName ??
                t("general.day", {
                  var_0: dayNumber,
                })}
            </h2>
            {ps.startDate && (
              <span className="rounded-md bg-[#DCEEFF] px-2 py-0.5 text-xs font-bold text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-blue-300">
                {format(new Date(ps.startDate), "dd/MM/yyyy")}
              </span>
            )}
            <Badge className={`text-[11px] font-semibold ${cfg.className}`}>{cfg.label}</Badge>
            <div className="ml-auto flex items-center gap-1.5">
              {(dayStatus === "IN_PROGRESS" || dayStatus === "COMPLETED") && (
                <>
                  <button
                    disabled={isCreating}
                    onClick={handleCreateAiQuiz}
                    title={t("userPractice.createNewQuiz")}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0047AB] text-white transition-opacity hover:opacity-80 disabled:opacity-50">
                    {isCreating ? <Spinner size="xs" tone="white" /> : <Plus className="h-3 w-3" />}
                  </button>
                  {quizHistory.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          title={t("userPractice.viewTestHistory")}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0047AB] text-[#0047AB] transition-colors hover:bg-[#DCEEFF] dark:hover:bg-[#0047AB]/20">
                          <History className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <QuizHistoryPopover
                        quizHistory={quizHistory}
                        routePracticeSetId={String(ps.id)}
                        sessionId={ps.interviewSessionId}
                      />
                    </Popover>
                  )}
                </>
              )}
              <CollapsibleTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground ml-1 flex h-6 w-6 items-center justify-center rounded transition-colors"
                  title={isOpen ? t("common.collapse") : t("common.extend")}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <div className="border-border space-y-2 border-t px-4 pt-3 pb-4">
              {questions.map((q, localIdx) => (
                <SessionQuestionCard
                  key={q.questionId ?? localIdx}
                  question={q}
                  index={localIdx}
                  status={getItemStatus(localIdx)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Confirmation dialog after AI quiz creation */}
      {pendingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-card mx-4 w-full max-w-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
                <p className="text-foreground text-base font-semibold">
                  {t("userPractice.createASuccessfulTest")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("userPractice.doYouWantToTake")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPendingQuiz(null)}>
                  {t("userPractice.later")}
                </Button>
                <Button
                  className="flex-1 bg-[#0047AB] hover:bg-[#003580]"
                  onClick={() => {
                    if (!ps.interviewSessionId || !ps.id) {
                      toast.error(t("userPractice.cannotOpenTestBecausePractice"));
                      return;
                    }
                    navigate(
                      buildPracticeQuizPath({
                        sessionId: ps.interviewSessionId,
                        practiceSetId: ps.id,
                        quizId: pendingQuiz.quizId,
                      }),
                      {
                        state: {
                          initialItems: pendingQuiz.items,
                          backUrl: pendingQuiz.backUrl,
                        },
                      }
                    );
                  }}>
                  {t("userPractice.doYourHomeworkNow")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// ─── DayGroup ────────────────────────────────────────────────────────────────

interface DayGroupProps {
  dayNumber: number;
  title?: string;
  dayItems: PracticeSetItem[];
  dayStatus: DayStatus;
  isCurrentDay: boolean;
  practiceSetId: string;
  interviewSessionId?: number;
  lastQuizId?: number;
  quizHistory: QuizSet[];
  isOpen: boolean;
  onToggle: () => void;
}
function DayGroup({
  dayNumber,
  title,
  dayItems,
  dayStatus,
  isCurrentDay,
  practiceSetId,
  interviewSessionId,
  lastQuizId,
  quizHistory,
  isOpen,
  onToggle,
}: DayGroupProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const handleCreateAiQuiz = async () => {
    setIsCreating(true);
    try {
      const res = await quizSetManager.createFullAi(Number(practiceSetId));
      if (res.success && res.data) {
        const newQuizId = (res.data as QuizResponse).quizId;
        if (newQuizId) {
          toast.success(t("userPractice.aiTestCreated"));
          if (!interviewSessionId) {
            toast.error(t("userPractice.cannotOpenTestBecausePractice"));
            return;
          }
          const quizBackUrl = buildPracticeSessionPath(interviewSessionId);
          navigate(
            buildPracticeQuizPath({
              sessionId: interviewSessionId,
              practiceSetId,
              quizId: newQuizId,
            }),
            {
              state: {
                initialItems: (res.data as QuizResponse).items,
                backUrl: quizBackUrl,
              },
            }
          );
        } else {
          toast.error(t("userPractice.unableToGetTestId"));
        }
      } else {
        toast.error(res.error ?? t("common.unableToCreateAiTest"));
      }
    } catch {
      toast.error(t("common.unableToCreateAiTest"));
    } finally {
      setIsCreating(false);
    }
  };
  const statusConfig: Record<
    DayStatus,
    {
      label: string;
      className: string;
    }
  > = {
    COMPLETED: {
      label: t("general.completed2"),
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    IN_PROGRESS: {
      label: t("userPractice.goingOn"),
      className: "bg-blue-100 text-[#0047AB] dark:bg-blue-900/40 dark:text-blue-300",
    },
    LOCKED: {
      label: t("userPractice.notOpen"),
      className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    },
  };
  const cfg = statusConfig[dayStatus];
  const getItemStatus = (localIdx: number): ItemStatus => {
    if (dayStatus === "LOCKED") return "LOCKED";
    if (dayStatus === "COMPLETED") return "DONE";
    // IN_PROGRESS: first item = NEXT, rest = AVAILABLE
    return localIdx === 0 && isCurrentDay ? "NEXT" : "AVAILABLE";
  };
  const firstLesson = dayItems[0]?.practiceQuestion?.lesson;
  const computedTitle = firstLesson
    ? t("general.day1", {
        var_0: dayNumber,
        var_1: firstLesson.lessonName ?? "",
      })
    : t("general.day", {
        var_0: dayNumber,
      });
  const dayTitle = title ?? computedTitle;
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div
        className={`bg-card rounded-xl border shadow-sm ${dayStatus === "IN_PROGRESS" ? "border-[#0047AB]/40" : dayStatus === "COMPLETED" ? "border-emerald-200 dark:border-emerald-900/40" : "border-border"}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <h2 className="text-foreground text-base font-bold">{dayTitle}</h2>
          <Badge className={`text-[11px] font-semibold ${cfg.className}`}>{cfg.label}</Badge>
          <div className="ml-auto flex items-center gap-1.5">
            {(dayStatus === "IN_PROGRESS" || dayStatus === "COMPLETED") && (
              <>
                <button
                  disabled={isCreating}
                  onClick={handleCreateAiQuiz}
                  title={t("userPractice.createNewQuiz")}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0047AB] text-white transition-opacity hover:opacity-80 disabled:opacity-50">
                  {isCreating ? <Spinner size="xs" tone="white" /> : <Plus className="h-3 w-3" />}
                </button>
                {quizHistory.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        title={t("userPractice.viewTestHistory")}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0047AB] text-[#0047AB] transition-colors hover:bg-[#DCEEFF] dark:hover:bg-[#0047AB]/20">
                        <History className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <QuizHistoryPopover
                      quizHistory={quizHistory}
                      routePracticeSetId={practiceSetId}
                      sessionId={interviewSessionId}
                    />
                  </Popover>
                )}
              </>
            )}
            <CollapsibleTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground ml-1 flex h-6 w-6 items-center justify-center rounded transition-colors"
                title={isOpen ? t("common.collapse") : t("common.extend")}>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-border space-y-2 border-t px-4 pt-3 pb-4">
            {dayItems.map((item, localIdx) => (
              <PracticeItemCard
                key={item.id}
                item={item}
                index={localIdx}
                status={getItemStatus(localIdx)}
                practiceSetId={practiceSetId}
                sessionId={interviewSessionId}
                lastQuizId={lastQuizId}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function PracticeSetDetailPage() {
  const { t } = useTranslation();
  const { id, sessionId } = useParams<{
    id: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    sessionSets?: PracticeSetResponse[];
  } | null;
  // Capture location state once on mount — prevents re-reading stale state on re-renders
  const preloadedSets = useRef(locationState?.sessionSets);
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [items, setItems] = useState<PracticeSetItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho chế độ xem toàn session (nhiều practice-sets)
  const [sessionDays, setSessionDays] = useState<PracticeSetResponse[]>([]);
  const [isSessionView, setIsSessionView] = useState(false);

  // Collapse state — each day group can be expanded/collapsed independently
  const [dayOpenStates, setDayOpenStates] = useState<boolean[]>([]);
  const [sessionOpenStates, setSessionOpenStates] = useState<boolean[]>([]);
  const applySessionData = (data: PracticeSetResponse[]) => {
    const first = data[0];
    setPracticeSet({
      id: first.id,
      practiceSetName: first.practiceSetName,
      objective: first.objective,
      level: first.level,
      startDate: first.startDate,
      interviewSessionId: first.interviewSessionId,
    });
    setSessionDays(data);
    setIsSessionView(true);
  };
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // ── Chế độ session ──────────────────────────────────────────────────────
      if (sessionId) {
        // If we have preloaded sets from navigation state, use them directly
        // instead of calling the API (requirement #9 — only call API on F5/refresh).
        const preloaded = preloadedSets.current;
        if (preloaded && preloaded.length > 0) {
          preloadedSets.current = undefined; // consume once
          applySessionData(preloaded);
        } else {
          // F5 (page refresh) — no location state, call the API
          const sessionRes = await practiceSetManager.getByInterviewSession(Number(sessionId));
          if (sessionRes.success && sessionRes.data && sessionRes.data.length > 0) {
            applySessionData(sessionRes.data);
          } else {
            toast.error(t("userPractice.noPracticeSetsFoundFor"));
          }
        }
        return;
      }

      // ── Chế độ đơn: xem một practice-set theo id ────────────────────────
      if (!id) return;
      const fullSetResponse = await practiceSetManager.getFullSet(id);
      if (fullSetResponse.success && fullSetResponse.data) {
        setPracticeSet(fullSetResponse.data.practiceSet);
        setItems(fullSetResponse.data.practiceSetItem ?? []);
      } else {
        const [setRes, itemsRes] = await Promise.all([
          practiceSetManager.getById(id),
          practiceSetItemManager.getByPracticeSetId(id),
        ]);
        if (setRes.success && setRes.data) setPracticeSet(setRes.data);
        else toast.error(setRes.error ?? t("userPractice.unableToLoadTrainingSet"));
        if (itemsRes.success && itemsRes.data) setItems(itemsRes.data as PracticeSetItem[]);
      }
      const quizRes = await quizSetManager.getByPracticeSet(Number(id));
      if (quizRes.success && quizRes.data) setQuizHistory(quizRes.data);
    } catch {
      toast.error(t("common.unableToDownloadData"));
    } finally {
      setLoading(false);
    }
  }, [id, sessionId, t]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── derived data ─────────────────────────────────────────────────────────

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    [items]
  );
  const dateNumber = parseDateNumber(practiceSet?.practiceSetName);
  const itemsPerDay = Math.max(1, Math.ceil(sortedItems.length / dateNumber));
  const dayGroups = useMemo(() => {
    const groups: PracticeSetItem[][] = [];
    for (let d = 0; d < dateNumber; d++) {
      const chunk = sortedItems.slice(d * itemsPerDay, (d + 1) * itemsPerDay);
      if (chunk.length > 0) groups.push(chunk);
    }
    // Append any leftover items (rounding edge-case) into the last group
    const covered = groups.flat().length;
    if (covered < sortedItems.length) {
      const leftover = sortedItems.slice(covered);
      if (groups.length > 0) groups[groups.length - 1].push(...leftover);
      else groups.push(leftover);
    }
    return groups;
  }, [sortedItems, dateNumber, itemsPerDay]);
  const submittedCount = quizHistory.filter((q) => q.submitted).length;
  const completedDays = Math.min(submittedCount, dayGroups.length);
  const progressPct =
    dayGroups.length === 0 ? 0 : Math.round((completedDays / dayGroups.length) * 100);
  const lastSubmittedQuiz = quizHistory
    .filter((q) => q.submitted)
    .sort((a, b) => (b.quizId ?? 0) - (a.quizId ?? 0))[0];
  const getDayStatus = (dayIdx: number): DayStatus => {
    if (dayIdx < completedDays) return "COMPLETED";
    if (dayIdx === completedDays) return "IN_PROGRESS";
    return "LOCKED";
  };
  const startDateLabel = practiceSet?.startDate
    ? format(new Date(practiceSet.startDate), "dd/MM/yyyy")
    : null;

  // ── session-view: tính status theo startDate so với ngày hiện tại ──────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const getSessionDayStatus = (ps: PracticeSetResponse, index: number): DayStatus => {
    // Days without a startDate are treated as IN_PROGRESS so users can still
    // access their content (e.g. newly generated sets not yet scheduled).
    if (!ps.startDate) return "IN_PROGRESS";
    const d = new Date(ps.startDate);
    d.setHours(0, 0, 0, 0);
    if (isSameDay(d, today)) return "IN_PROGRESS";
    if (d < today) return "COMPLETED";
    // Always unlock the FIRST future day after all active (today + past) days
    // so there is at least one upcoming day available for practice/testing.
    const passedCount = sessionDays.filter((day) => {
      if (!day.startDate) return false;
      const dd = new Date(day.startDate);
      dd.setHours(0, 0, 0, 0);
      return dd <= today;
    }).length;
    if (index < passedCount + 1) return "IN_PROGRESS";
    return "LOCKED";
  };
  const totalDays = sessionDays.length;
  // Số ngày đã trôi qua (bao gồm hôm nay): dùng cho tiến độ theo công thức 100/totalDays * elapsedDays
  const sessionElapsedCount = sessionDays.filter((ps) => {
    if (!ps.startDate) return false;
    const d = new Date(ps.startDate);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }).length;
  const sessionProgressPct =
    totalDays === 0 ? 0 : Math.round((sessionElapsedCount / totalDays) * 100);

  // Initialize collapse states when data loads (all open by default)
  useEffect(() => {
    setDayOpenStates(Array(dayGroups.length).fill(true));
  }, [dayGroups.length]);
  useEffect(() => {
    setSessionOpenStates(Array(sessionDays.length).fill(true));
  }, [sessionDays.length]);

  // ── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-background min-h-screen space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!practiceSet) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-foreground font-medium">{t("userPractice.noTrainingSetFound")}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/user?tab=practice")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("general.back")}
          </Button>
        </Card>
      </div>
    );
  }

  // Chế độ xem toàn session: hiển thị tất cả practice-sets của session, mỗi set = 1 ngày
  if (isSessionView && sessionDays.length > 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {/* Title block */}
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              {t("userPractice.trainingPathSession")}
              {practiceSet.interviewSessionId}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {practiceSet.level && <Badge variant="secondary">{practiceSet.level}</Badge>}
              {practiceSet.major?.majorName && (
                <Badge variant="outline">{practiceSet.major.majorName}</Badge>
              )}
            </div>
          </div>

          {/* Progress card */}
          <Card>
            <CardContent className="pt-4 pb-5">
              <div className="mb-2 flex items-baseline justify-between">
                <div>
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("userPractice.currentProgress")}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-foreground text-2xl font-bold">
                      {sessionProgressPct}%
                    </span>

                    <span className="text-muted-foreground text-sm">{t("general.completed1")}</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-sm font-medium">
                  {sessionElapsedCount}/{totalDays} {t("userPractice.day")}
                </span>
              </div>
              <Progress value={sessionProgressPct} className="h-2.5" />
              {totalDays - sessionElapsedCount > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {t("userPractice.still")} {totalDays - sessionElapsedCount}{" "}
                  {t("userPractice.anotherDayToCompleteThe")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Day groups — one per practice-set, with embedded questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {t("userPractice.learningPath")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => {
                  const allOpen = sessionOpenStates.every(Boolean);
                  setSessionOpenStates(sessionDays.map(() => !allOpen));
                }}>
                {sessionOpenStates.every(Boolean) ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    {t("userPractice.collapseAll")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    {t("userPractice.openAll")}
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-8">
              {sessionDays.map((ps, dayIdx) => (
                <SessionDayGroup
                  key={ps.id ?? dayIdx}
                  ps={ps}
                  dayNumber={dayIdx + 1}
                  dayStatus={getSessionDayStatus(ps, dayIdx)}
                  isOpen={sessionOpenStates[dayIdx] ?? true}
                  onToggle={() =>
                    setSessionOpenStates((prev) => prev.map((v, i) => (i === dayIdx ? !v : v)))
                  }
                />
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <Card className="border-[#0047AB]/20 bg-linear-to-r from-[#DCEEFF] to-[#F0F8FF] dark:from-[#0047AB]/10 dark:to-[#007BFF]/5">
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
              <MessageCircle className="h-8 w-8 text-[#0047AB]" />
              <div>
                <CardTitle className="text-foreground text-base">
                  {t("userPractice.havingTroubleWithExercises")}
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("userPractice.connectWithMentorToGet")}
                </p>
              </div>
              <Button
                className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
                onClick={() => navigate("/user?tab=mentors")}>
                {t("userPractice.askMentorQuestions")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Title block */}
        <div>
          <h1 className="text-foreground text-2xl font-bold">
            {practiceSet.practiceSetName ?? t("common.detailsOfPracticeSet")}
          </h1>
          {practiceSet.objective && (
            <p className="text-muted-foreground mt-1 text-sm">{practiceSet.objective}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {practiceSet.level && <Badge variant="secondary">{practiceSet.level}</Badge>}
            {practiceSet.major?.majorName && (
              <Badge variant="outline">{practiceSet.major.majorName}</Badge>
            )}
            {startDateLabel && (
              <Badge variant="outline" className="text-muted-foreground">
                {t("common.begin")} {startDateLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress card */}
        <Card>
          <CardContent className="pt-4 pb-5">
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("userPractice.currentProgress")}
                </span>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-foreground text-2xl font-bold">{progressPct}%</span>
                  <span className="text-muted-foreground text-sm">{t("general.completed1")}</span>
                </div>
              </div>
              <span className="text-muted-foreground text-sm font-medium">
                {completedDays}/{dayGroups.length} {t("userPractice.day")}
              </span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            {dayGroups.length - completedDays > 0 && (
              <p className="text-muted-foreground mt-2 text-xs">
                {t("userPractice.still")} {dayGroups.length - completedDays}{" "}
                {t("userPractice.anotherDayToCompleteThe")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Day groups */}
        {dayGroups.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <GraduationCap className="text-muted-foreground mx-auto h-10 w-10" />
              <p className="text-muted-foreground mt-2 text-sm">
                {t("userPractice.thereAreNoExercisesIn")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                {t("userPractice.learningPath")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => {
                  const allOpen = dayOpenStates.every(Boolean);
                  setDayOpenStates(dayGroups.map(() => !allOpen));
                }}>
                {dayOpenStates.every(Boolean) ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    {t("userPractice.collapseAll")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    {t("userPractice.openAll")}
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-8">
              {dayGroups.map((dayItems, dayIdx) => (
                <DayGroup
                  key={dayIdx}
                  dayNumber={dayIdx + 1}
                  dayItems={dayItems}
                  dayStatus={getDayStatus(dayIdx)}
                  isCurrentDay={dayIdx === completedDays}
                  practiceSetId={id!}
                  interviewSessionId={practiceSet?.interviewSessionId}
                  lastQuizId={lastSubmittedQuiz?.quizId}
                  quizHistory={dayIdx === completedDays ? quizHistory : []}
                  isOpen={dayOpenStates[dayIdx] ?? true}
                  onToggle={() =>
                    setDayOpenStates((prev) => prev.map((v, i) => (i === dayIdx ? !v : v)))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <Card className="border-[#0047AB]/20 bg-linear-to-r from-[#DCEEFF] to-[#F0F8FF] dark:from-[#0047AB]/10 dark:to-[#007BFF]/5">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <MessageCircle className="h-8 w-8 text-[#0047AB]" />
            <div>
              <CardTitle className="text-foreground text-base">
                {t("userPractice.havingTroubleWithExercises")}
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("userPractice.connectWithMentorToGet")}
              </p>
            </div>
            <Button
              className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
              onClick={() => navigate("/user?tab=mentors")}>
              {t("userPractice.askMentorQuestions")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
