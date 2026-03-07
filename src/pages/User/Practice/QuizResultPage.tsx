import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { quizSetManager } from "@/services";
import type { QuizItem, QuizSet } from "@/services/quiz-set.manager";
import { toast } from "sonner";

export function QuizResultPage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Persist backUrl in sessionStorage so it survives F5 refresh
  const storageKey = `quiz_backUrl_${id}_${quizId}`;
  const [backUrl, setBackUrl] = useState<string>(() => {
    const stateUrl = (location.state as { backUrl?: string } | null)?.backUrl;
    if (stateUrl) {
      try {
        sessionStorage.setItem(storageKey, stateUrl);
      } catch {
        /* ignore */
      }
      return stateUrl;
    }
    try {
      return sessionStorage.getItem(storageKey) ?? `/user?tab=practice`;
    } catch {
      return `/user?tab=practice`;
    }
  });
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      // GET /api/quiz-sets/{quizId} returns QuizSet with embedded questions[]
      const quizResponse = await quizSetManager.getById(Number(quizId));
      if (quizResponse.success && quizResponse.data) {
        setQuizSet(quizResponse.data);
        setQuizItems(quizResponse.data.questions ?? []);
        // Update backUrl using interviewSessionId from quiz data
        const sessionId = quizResponse.data.practiceSet?.interviewSessionId;
        if (sessionId) {
          const url = `/user/practice/session/${sessionId}`;
          setBackUrl(url);
          try {
            sessionStorage.setItem(storageKey, url);
          } catch {
            /* ignore */
          }
        }
      } else {
        toast.error("Không thể tải kết quả bài trắc nghiệm");
      }
    } catch {
      toast.error("Không thể tải kết quả bài trắc nghiệm");
    } finally {
      setLoading(false);
    }
  }, [quizId, storageKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalQuestions = quizItems.length;
  const correctCount = quizItems.filter(
    (item) => item.userResponse && item.userResponse === item.correctAnswer
  ).length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const displayScore = quizSet?.score !== undefined ? quizSet.score : scorePercentage;

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        {/* Score Card */}
        <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-0">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-white">Kết Quả Quiz</h1>
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">{displayScore}%</span>
            </div>
            <p className="text-lg text-white/90">
              Bạn trả lời đúng {correctCount} / {totalQuestions} câu hỏi
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mb-8 flex items-center justify-center">
          <Button variant="outline" className="gap-2" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại lộ trình luyện tập
          </Button>
        </div>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết đáp án</CardTitle>
            <CardDescription>Xem lại câu trả lời của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quizItems.map((item, index) => {
                const isCorrect = item.userResponse === item.correctAnswer;
                return (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-foreground font-medium">
                          Câu {index + 1}: {item.question}
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Câu trả lời của bạn: </span>
                            <Badge
                              variant={isCorrect ? "default" : "destructive"}
                              className="text-xs">
                              {item.userResponse || "Chưa trả lời"}
                            </Badge>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="text-muted-foreground">Đáp án đúng: </span>
                              <Badge className="bg-green-100 text-xs text-green-700 hover:bg-green-100">
                                {item.correctAnswer}
                              </Badge>
                            </p>
                          )}
                          {item.explanation && (
                            <div className="mt-2 rounded-md bg-[#F0F8FF] p-3">
                              <p className="text-sm font-medium text-[#0047AB]">Giải thích:</p>
                              <p className="text-muted-foreground text-sm">{item.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
