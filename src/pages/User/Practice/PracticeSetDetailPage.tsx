import { ArrowLeft, BookOpen, Clock, Eye, Lightbulb, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { practiceSetItemManager, practiceSetManager, quizSetManager } from "@/services";
import type { PracticeSetItem } from "@/services/practice-set-item.manager";
import type { PracticeSet } from "@/services/practice-set.manager";
import type { QuizSet } from "@/services/quiz-set.manager";
import { toast } from "sonner";

const questionLevelBadgeMap: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 hover:bg-green-100",
  MEDIUM: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  HARD: "bg-red-100 text-red-700 hover:bg-red-100",
};

function QuestionCard({ item, index }: { item: PracticeSetItem; index: number }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-sm font-medium">{index + 1}.</span>
        <div className="flex-1">
          <p className="text-foreground font-medium">{item.practiceQuestion?.title}</p>
          {item.practiceQuestion?.content && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {item.practiceQuestion.content}
            </p>
          )}
        </div>
        <Badge
          className={
            questionLevelBadgeMap[item.practiceQuestion?.level || ""] || "bg-gray-100 text-gray-700"
          }>
          {item.practiceQuestion?.level}
        </Badge>
      </div>

      {/* Action buttons */}
      {(item.practiceQuestion?.hint || item.practiceQuestion?.answer) && (
        <div className="mt-3 flex items-center gap-2">
          {item.practiceQuestion?.hint && (
            <Button
              variant={showHint ? "default" : "outline"}
              size="sm"
              className={
                showHint
                  ? "gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                  : "gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
              }
              onClick={() => setShowHint(!showHint)}>
              <Lightbulb className="h-3.5 w-3.5" />
              {showHint ? "Ẩn gợi ý" : "Gợi ý"}
            </Button>
          )}
          {item.practiceQuestion?.answer && (
            <Button
              variant={showAnswer ? "default" : "outline"}
              size="sm"
              className={
                showAnswer
                  ? "gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600"
                  : "gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              }
              onClick={() => setShowAnswer(!showAnswer)}>
              <Eye className="h-3.5 w-3.5" />
              {showAnswer ? "Ẩn đáp án" : "Đáp án"}
            </Button>
          )}
        </div>
      )}

      {/* Hint section */}
      {showHint && item.practiceQuestion?.hint && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-400">Gợi ý:</p>
          <p className="text-sm whitespace-pre-line text-amber-900 dark:text-amber-200">
            {item.practiceQuestion.hint}
          </p>
        </div>
      )}

      {/* Answer section */}
      {showAnswer && item.practiceQuestion?.answer && (
        <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Đáp án:
          </p>
          <p className="text-sm whitespace-pre-line text-emerald-900 dark:text-emerald-200">
            {item.practiceQuestion.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function PracticeSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [items, setItems] = useState<PracticeSetItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Try getFullSet first, fallback to getById + getByPracticeSetId
      const fullSetResponse = await practiceSetManager.getFullSet(id);

      if (fullSetResponse.success && fullSetResponse.data) {
        setPracticeSet(fullSetResponse.data.practiceSet);
        setItems(fullSetResponse.data.practiceSetItem || []);
      } else {
        // Fallback: load practice set info and items separately
        // Use api/practice-set-item/by-question-set/{id} as BE stated
        const [setResponse, itemsResponse] = await Promise.all([
          practiceSetManager.getById(id),
          practiceSetItemManager.getByPracticeSetId(id),
        ]);

        if (setResponse.success && setResponse.data) {
          setPracticeSet(setResponse.data);
        } else {
          toast.error(setResponse.error || "Không thể tải thông tin bộ luyện tập");
        }

        if (itemsResponse.success && itemsResponse.data) {
          setItems(itemsResponse.data);
        }
      }

      // Load quiz history
      const quizResponse = await quizSetManager.getByPracticeSet(Number(id));
      if (quizResponse.success && quizResponse.data) {
        setQuizHistory(quizResponse.data);
      }
    } catch (error) {
      console.error("Error loading practice set detail:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!practiceSet) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-foreground font-medium">Không tìm thấy bộ luyện tập</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/dashboard/practice")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate("/dashboard/practice")}>
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Practice Set Info */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-white">{practiceSet.practiceSetName}</h1>
            {practiceSet.objective && (
              <p className="max-w-lg text-lg text-white/90">{practiceSet.objective}</p>
            )}
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                {practiceSet.level}
              </Badge>
              {practiceSet.major?.majorName && (
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {practiceSet.major.majorName}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-14 w-14 text-white" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Questions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách câu hỏi ({items.length})</CardTitle>
              <CardDescription>Các câu hỏi trong bộ luyện tập này</CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  Chưa có câu hỏi nào trong bộ luyện tập này
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <QuestionCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bắt đầu trắc nghiệm */}
          <Card>
            <CardHeader>
              <CardTitle>Bắt đầu trắc nghiệm</CardTitle>
              <CardDescription>Kiểm tra kiến thức của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full gap-2"
                onClick={() => navigate(`/dashboard/practice/${id}/quiz`)}>
                <Play className="h-4 w-4" />
                Bắt đầu trắc nghiệm
              </Button>
            </CardContent>
          </Card>

          {/* Lịch sử trắc nghiệm */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử trắc nghiệm</CardTitle>
              <CardDescription>Các lần làm trước đây</CardDescription>
            </CardHeader>
            <CardContent>
              {quizHistory.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Chưa có lịch sử trắc nghiệm nào
                </p>
              ) : (
                <div className="space-y-3">
                  {quizHistory.map((quiz) => (
                    <div key={quiz.quizId} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{quiz.quizName}</p>
                        <Badge variant={quiz.submitted ? "default" : "secondary"}>
                          {quiz.submitted ? "Đã nộp" : "Chưa nộp"}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                        {quiz.score !== undefined && <span>Điểm: {quiz.score}</span>}
                        {quiz.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(quiz.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
