import { format, isSameDay } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Lightbulb,
  Lock,
  MessageCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { practiceSetItemManager, practiceSetManager, quizSetManager } from "@/services";
import type { PracticeSetItem } from "@/services/practice-set-item.manager";
import type { PracticeSet, SessionQuestion } from "@/services/practice-set.manager";
import type { QuizSet } from "@/services/quiz-set.manager";
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
  lastQuizId?: number;
}

function PracticeItemCard({ item, index, status, practiceSetId, lastQuizId }: ItemCardProps) {
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const isDone = status === "DONE";
  const isNext = status === "NEXT";
  const isLocked = status === "LOCKED";

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        isLocked ? "opacity-50" : ""
      } ${isNext ? "border-[#0047AB] bg-blue-50/60 shadow-sm ring-1 ring-[#0047AB]/20 dark:bg-blue-950/20" : "border-border bg-card"}`}>
      {/* NEXT badge */}
      {isNext && (
        <div className="absolute -top-2.5 right-3">
          <Badge className="bg-[#0047AB] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            NEXT
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
              {item.practiceQuestion?.title ?? `Câu hỏi ${index + 1}`}
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
              30 mins
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
                    Gợi ý
                  </Button>
                )}
                {item.practiceQuestion?.answer && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400"
                    onClick={() => setShowAnswer((v) => !v)}>
                    <Eye className="h-3 w-3" />
                    Đáp án
                  </Button>
                )}
                {isDone ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-6 gap-1 px-2 text-xs"
                    onClick={() =>
                      lastQuizId
                        ? navigate(`/user/practice/${practiceSetId}/quiz/${lastQuizId}/result`)
                        : navigate(`/user/practice/${practiceSetId}/quiz`)
                    }>
                    Xem lại
                    <Eye className="h-3 w-3" />
                  </Button>
                ) : isNext ? (
                  <Button
                    size="sm"
                    className="ml-auto h-6 gap-1 bg-[#0047AB] px-3 text-xs text-white hover:bg-[#005B9A]"
                    onClick={() => navigate(`/user/practice/${practiceSetId}/quiz`)}>
                    Bắt đầu ngay
                  </Button>
                ) : null}
              </>
            )}

            {isLocked && <span className="text-muted-foreground ml-auto text-xs">Chưa mở</span>}
          </div>

          {/* Hint */}
          {showHint && item.practiceQuestion?.hint && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Gợi ý:</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                {item.practiceQuestion.hint}
              </p>
            </div>
          )}

          {/* Answer */}
          {showAnswer && item.practiceQuestion?.answer && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Đáp án:
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
  question: SessionQuestion;
  index: number;
  status: ItemStatus;
  psId: number;
}

function SessionQuestionCard({ question, index, status, psId }: SessionItemCardProps) {
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const isDone = status === "DONE";
  const isNext = status === "NEXT";
  const isLocked = status === "LOCKED";

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${isLocked ? "opacity-50" : ""} ${
        isNext
          ? "border-[#0047AB] bg-blue-50/60 shadow-sm ring-1 ring-[#0047AB]/20 dark:bg-blue-950/20"
          : "border-border bg-card"
      }`}>
      {isNext && (
        <div className="absolute -top-2.5 right-3">
          <Badge className="bg-[#0047AB] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            NEXT
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
              {question.title ?? `Câu hỏi ${index + 1}`}
            </p>
            <Badge
              className={`shrink-0 text-xs ${
                levelBadge[question.level ?? ""] ?? "bg-gray-100 text-gray-700"
              }`}>
              {question.level}
            </Badge>
          </div>

          {question.content && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{question.content}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              30 mins
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
                    Gợi ý
                  </Button>
                )}
                {question.answer && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400"
                    onClick={() => setShowAnswer((v) => !v)}>
                    <Eye className="h-3 w-3" />
                    Đáp án
                  </Button>
                )}
                {isNext && (
                  <Button
                    size="sm"
                    className="ml-auto h-6 gap-1 bg-[#0047AB] px-3 text-xs text-white hover:bg-[#005B9A]"
                    onClick={() => navigate(`/user/practice/${psId}/quiz`)}>
                    Bắt đầu ngay
                  </Button>
                )}
              </>
            )}

            {isLocked && <span className="text-muted-foreground ml-auto text-xs">Chưa mở</span>}
          </div>

          {showHint && question.hint && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Gợi ý:</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                {question.hint}
              </p>
            </div>
          )}

          {showAnswer && question.answer && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Đáp án:
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

// ─── SessionDayGroup (used only in session/roadmap view) ─────────────────────

interface SessionDayGroupProps {
  ps: PracticeSet;
  dayNumber: number;
  dayStatus: DayStatus;
}

function SessionDayGroup({ ps, dayNumber, dayStatus }: SessionDayGroupProps) {
  const statusConfig: Record<DayStatus, { label: string; className: string }> = {
    COMPLETED: {
      label: "HOÀN THÀNH",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    IN_PROGRESS: {
      label: "ĐANG DIỄN RA",
      className: "bg-blue-100 text-[#0047AB] dark:bg-blue-900/40 dark:text-blue-300",
    },
    LOCKED: {
      label: "CHƯA MỞ",
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
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground text-base font-bold">
          {ps.practiceSetName ?? `Ngày ${dayNumber}`}
        </h2>
        <Badge className={`text-[11px] font-semibold ${cfg.className}`}>{cfg.label}</Badge>
      </div>
      <div className="space-y-2">
        {questions.map((q, localIdx) => (
          <SessionQuestionCard
            key={q.questionId ?? localIdx}
            question={q}
            index={localIdx}
            status={getItemStatus(localIdx)}
            psId={ps.id!}
          />
        ))}
      </div>
    </div>
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
  lastQuizId?: number;
}

function DayGroup({
  dayNumber,
  title,
  dayItems,
  dayStatus,
  isCurrentDay,
  practiceSetId,
  lastQuizId,
}: DayGroupProps) {
  const statusConfig: Record<DayStatus, { label: string; className: string }> = {
    COMPLETED: {
      label: "HOÀN THÀNH",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    IN_PROGRESS: {
      label: "ĐANG DIỄN RA",
      className: "bg-blue-100 text-[#0047AB] dark:bg-blue-900/40 dark:text-blue-300",
    },
    LOCKED: {
      label: "CHƯA MỞ",
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
    ? `Ngày ${dayNumber}: ${firstLesson.lessonName ?? ""}`
    : `Ngày ${dayNumber}`;
  const dayTitle = title ?? computedTitle;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground text-base font-bold">{dayTitle}</h2>
        <Badge className={`text-[11px] font-semibold ${cfg.className}`}>{cfg.label}</Badge>
      </div>
      <div className="space-y-2">
        {dayItems.map((item, localIdx) => (
          <PracticeItemCard
            key={item.id}
            item={item}
            index={localIdx}
            status={getItemStatus(localIdx)}
            practiceSetId={practiceSetId}
            lastQuizId={lastQuizId}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function PracticeSetDetailPage() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [items, setItems] = useState<PracticeSetItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho chế độ xem toàn session (nhiều practice-sets)
  const [sessionDays, setSessionDays] = useState<PracticeSet[]>([]);
  const [isSessionView, setIsSessionView] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // ── Chế độ session: chỉ lấy metadata, không nạp items hay quiz ─────────
      if (sessionId) {
        const sessionRes = await practiceSetManager.getByInterviewSession(Number(sessionId));
        if (sessionRes.success && sessionRes.data && sessionRes.data.length > 0) {
          setPracticeSet(sessionRes.data[0]);
          setSessionDays(sessionRes.data);
          setIsSessionView(true);
        } else {
          toast.error("Không tìm thấy bộ luyện tập nào cho phiên này");
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
        else toast.error(setRes.error ?? "Không thể tải thông tin bộ luyện tập");
        if (itemsRes.success && itemsRes.data) setItems(itemsRes.data as PracticeSetItem[]);
      }
      const quizRes = await quizSetManager.getByPracticeSet(Number(id));
      if (quizRes.success && quizRes.data) setQuizHistory(quizRes.data);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id, sessionId]);

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

  const getSessionDayStatus = (ps: PracticeSet): DayStatus => {
    if (!ps.startDate) return "LOCKED";
    const d = new Date(ps.startDate);
    d.setHours(0, 0, 0, 0);
    if (isSameDay(d, today)) return "IN_PROGRESS";
    if (d < today) return "COMPLETED";
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
          <p className="text-foreground font-medium">Không tìm thấy bộ luyện tập</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/user?tab=practice")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            <button
              onClick={() => navigate("/user?tab=practice")}
              className="text-[#0047AB] hover:underline">
              ← Bộ luyện tập
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">
              Lộ trình phiên #{practiceSet.interviewSessionId}
            </span>
          </nav>

          {/* Title block */}
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              Lộ trình luyện tập — Phiên #{practiceSet.interviewSessionId}
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
                    Tiến độ hiện tại
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-foreground text-2xl font-bold">
                      {sessionProgressPct}%
                    </span>

                    <span className="text-muted-foreground text-sm">hoàn thành</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-sm font-medium">
                  {sessionElapsedCount}/{totalDays} ngày
                </span>
              </div>
              <Progress value={sessionProgressPct} className="h-2.5" />
              {totalDays - sessionElapsedCount > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Còn {totalDays - sessionElapsedCount} ngày nữa để hoàn thành lộ trình
                </p>
              )}
            </CardContent>
          </Card>

          {/* Day groups — one per practice-set, with embedded questions */}
          <div className="space-y-8">
            {sessionDays.map((ps, dayIdx) => (
              <SessionDayGroup
                key={ps.id ?? dayIdx}
                ps={ps}
                dayNumber={dayIdx + 1}
                dayStatus={getSessionDayStatus(ps)}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <Card className="border-[#0047AB]/20 bg-gradient-to-r from-[#DCEEFF] to-[#F0F8FF] dark:from-[#0047AB]/10 dark:to-[#007BFF]/5">
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
              <MessageCircle className="h-8 w-8 text-[#0047AB]" />
              <div>
                <CardTitle className="text-foreground text-base">
                  Bạn gặp khó khăn với bài tập?
                </CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  Kết nối với Mentor để được giải đáp thắc mắc ngay lúc này.
                </p>
              </div>
              <Button
                className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
                onClick={() => navigate("/user?tab=mentors")}>
                Đặt câu hỏi cho Mentor
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => navigate("/user?tab=practice")}
            className="text-[#0047AB] hover:underline">
            ← Bộ luyện tập
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground line-clamp-1">{practiceSet.practiceSetName}</span>
        </nav>

        {/* Title block */}
        <div>
          <h1 className="text-foreground text-2xl font-bold">Lộ trình luyện tập theo Session</h1>
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
                Bắt đầu: {startDateLabel}
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
                  Tiến độ hiện tại
                </span>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-foreground text-2xl font-bold">{progressPct}%</span>
                  <span className="text-muted-foreground text-sm">hoàn thành</span>
                </div>
              </div>
              <span className="text-muted-foreground text-sm font-medium">
                {completedDays}/{dayGroups.length} ngày
              </span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            {dayGroups.length - completedDays > 0 && (
              <p className="text-muted-foreground mt-2 text-xs">
                Còn {dayGroups.length - completedDays} ngày nữa để hoàn thành lộ trình
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
                Chưa có bài tập nào trong lộ trình này
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {dayGroups.map((dayItems, dayIdx) => (
              <DayGroup
                key={dayIdx}
                dayNumber={dayIdx + 1}
                dayItems={dayItems}
                dayStatus={getDayStatus(dayIdx)}
                isCurrentDay={dayIdx === completedDays}
                practiceSetId={id!}
                lastQuizId={lastSubmittedQuiz?.quizId}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <Card className="border-[#0047AB]/20 bg-gradient-to-r from-[#DCEEFF] to-[#F0F8FF] dark:from-[#0047AB]/10 dark:to-[#007BFF]/5">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <MessageCircle className="h-8 w-8 text-[#0047AB]" />
            <div>
              <CardTitle className="text-foreground text-base">
                Bạn gặp khó khăn với bài tập?
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Kết nối với Mentor để được giải đáp thắc mắc ngay lúc này.
              </p>
            </div>
            <Button
              className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
              onClick={() => navigate("/user?tab=mentors")}>
              Đặt câu hỏi cho Mentor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
