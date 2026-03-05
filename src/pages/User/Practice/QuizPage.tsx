import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { quizSetManager } from "@/services";
import type { QuizItem, QuizSet } from "@/services/quiz-set.manager";
import { toast } from "sonner";

export function QuizPage() {
  const { id, quizId } = useParams<{ id: string; quizId?: string }>();
  const navigate = useNavigate();
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (quizId) {
        // Load mode: load an existing quiz by ID (no creation)
        const [setRes, itemsRes] = await Promise.all([
          quizSetManager.getById(Number(quizId)),
          quizSetManager.getQuizItems(Number(quizId)),
        ]);
        if (setRes.success && setRes.data) setQuizSet(setRes.data);
        else toast.error("Không tìm thấy bài kiểm tra");
        if (itemsRes.success && itemsRes.data) setQuizItems(itemsRes.data);
      } else {
        // Create mode: create a new quiz for this practice set (legacy path)
        const quizName = `Quiz - ${new Date().toLocaleDateString("vi-VN")}`;
        const createResponse = await quizSetManager.createFull(Number(id), quizName, []);

        if (createResponse.success && createResponse.data) {
          if (Array.isArray(createResponse.data) && createResponse.data.length > 0) {
            const firstItem = createResponse.data[0];
            if (firstItem.quizSet) {
              setQuizSet(firstItem.quizSet);
            }
            setQuizItems(createResponse.data);
          }
        } else {
          // Fallback: try to get existing quiz from history
          const historyResponse = await quizSetManager.getByPracticeSet(Number(id));
          if (historyResponse.success && historyResponse.data && historyResponse.data.length > 0) {
            const latestQuiz = historyResponse.data[historyResponse.data.length - 1];
            setQuizSet(latestQuiz);

            if (latestQuiz.quizId) {
              const itemsResponse = await quizSetManager.getQuizItems(latestQuiz.quizId);
              if (itemsResponse.success && itemsResponse.data) {
                setQuizItems(itemsResponse.data);
              }
            }
          } else {
            toast.error("Không thể tạo bài trắc nghiệm. Vui lòng thử lại.");
          }
        }
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast.error("Không thể tải dữ liệu bài trắc nghiệm");
    } finally {
      setLoading(false);
    }
  }, [id, quizId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parseOptions = (optionsStr?: string): Record<string, string> => {
    if (!optionsStr) return {};
    try {
      return JSON.parse(optionsStr);
    } catch {
      return {};
    }
  };

  const currentItem = quizItems[currentIndex];
  const options = parseOptions(currentItem?.options);
  const totalQuestions = quizItems.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelectAnswer = (key: string) => {
    if (!currentItem?.question) return;
    setAnswers((prev) => ({
      ...prev,
      [currentItem.question!]: key,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const quizId = quizSet?.quizId;
    if (!quizId) {
      toast.error("Không tìm thấy bài trắc nghiệm để nộp bài");
      return;
    }

    setSubmitting(true);
    try {
      const response = await quizSetManager.submit(quizId, answers);
      if (response.success) {
        toast.success("Đã nộp bài thành công!");
        navigate(`/user/practice/${id}/quiz/${quizId}/result`);
      } else {
        toast.error(response.error || "Không thể nộp bài");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Không thể nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Đang tải bài trắc nghiệm...</p>
        </div>
      </div>
    );
  }

  if (quizItems.length === 0) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <p className="text-foreground font-medium">
            Không có câu hỏi nào trong bài trắc nghiệm này
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`/user/practice/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Header */}
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate(`/user/practice/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại bộ luyện tập
        </Button>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Câu {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Câu {currentIndex + 1}</CardTitle>
            <CardDescription className="text-foreground text-base">
              {currentItem?.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(options).map(([key, value]) => {
                const isSelected = answers[currentItem?.question || ""] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectAnswer(key)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[#007BFF] bg-[#DCEEFF] text-[#0047AB]"
                        : "hover:border-primary/50 hover:bg-muted"
                    }`}>
                    <span className="font-medium">{key}.</span> {value}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Câu trước
          </Button>

          {currentIndex === totalQuestions - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 bg-[#0047AB] hover:bg-[#003580]">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Nộp bài
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Câu tiếp
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
