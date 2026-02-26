import { ChevronDown, ChevronUp, Filter, Search, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { questionManager } from "@/services";
import type { PracticeQuestion } from "@/services/question.manager";
import { toast } from "sonner";

const levelBadgeMap: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 hover:bg-green-100",
  MEDIUM: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  HARD: "bg-red-100 text-red-700 hover:bg-red-100",
};

export function PracticeQuestionsPage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await questionManager.getAll();
      if (response.success && response.data) {
        const raw = response.data;
        const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
        setQuestions(arr as unknown as PracticeQuestion[]);
      } else {
        toast.error(response.error || "Không thể tải danh sách câu hỏi");
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRandomQuestions = async () => {
    if (levelFilter === "all") {
      toast.error("Vui lòng chọn cấp độ trước khi lấy câu hỏi ngẫu nhiên");
      return;
    }
    setLoading(true);
    try {
      const response = await questionManager.getRandomByLevel(levelFilter, 10);
      if (response.success && response.data) {
        setQuestions(response.data);
        toast.success("Đã tải câu hỏi ngẫu nhiên");
      } else {
        toast.error(response.error || "Không thể tải câu hỏi ngẫu nhiên");
      }
    } catch (error) {
      console.error("Error fetching random questions:", error);
      toast.error("Không thể tải câu hỏi ngẫu nhiên");
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          const matchesSearch =
            q.title?.toLowerCase().includes(lowerQuery) ||
            q.content?.toLowerCase().includes(lowerQuery) ||
            q.lesson?.lessonName?.toLowerCase().includes(lowerQuery);
          if (!matchesSearch) return false;
        }
        if (levelFilter !== "all" && q.level !== levelFilter) {
          return false;
        }
        return true;
      })
      .reverse();
  }, [questions, searchQuery, levelFilter]);

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

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-white">Ngân hàng câu hỏi luyện tập</h1>
            <p className="max-w-lg text-lg text-white/90">
              Luyện tập với các câu hỏi theo cấp độ để chuẩn bị tốt nhất cho buổi phỏng vấn!
            </p>
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Search className="h-14 w-14 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[300px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
              Cấp độ:
            </span>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleRandomQuestions} variant="outline" className="gap-2">
            <Shuffle className="h-4 w-4" />
            Câu hỏi ngẫu nhiên
          </Button>
        </div>
      </Card>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuestions.map((question) => (
          <Card
            key={question.questionId}
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={() =>
              setExpandedId(
                expandedId === question.questionId ? null : (question.questionId ?? null)
              )
            }>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-primary text-base">{question.title}</CardTitle>
                {expandedId === question.questionId ? (
                  <ChevronUp className="text-muted-foreground h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={levelBadgeMap[question.level || ""] || "bg-gray-100 text-gray-700"}>
                  {question.level}
                </Badge>
                {question.lesson?.lessonName && (
                  <Badge variant="secondary" className="text-xs">
                    {question.lesson.lessonName}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2">{question.content}</CardDescription>
              {expandedId === question.questionId && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  {question.answer && (
                    <div>
                      <p className="text-sm font-semibold text-green-700">Đáp án:</p>
                      <p className="text-muted-foreground text-sm">{question.answer}</p>
                    </div>
                  )}
                  {question.hint && (
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Gợi ý:</p>
                      <p className="text-muted-foreground text-sm">{question.hint}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredQuestions.length === 0 && (
        <Card className="flex h-64 flex-col items-center justify-center gap-4">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">Không tìm thấy câu hỏi nào phù hợp</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Hãy thử điều chỉnh bộ lọc để tìm kết quả khác
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("all");
            }}>
            <Filter className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </Card>
      )}
    </div>
  );
}
