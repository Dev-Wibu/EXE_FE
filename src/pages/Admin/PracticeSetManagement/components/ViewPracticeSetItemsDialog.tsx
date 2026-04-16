import { Plus, Search, Trash2, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { practiceSetItemManager, questionManager } from "@/services";
import type { PracticeSetItem } from "@/services/practice-set-item.manager";
import type { PracticeQuestion } from "@/services/question.manager";
import { toast } from "sonner";

import type { PracticeSet } from "../types";

const questionLevelBadgeMap: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 hover:bg-green-100",
  MEDIUM: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  HARD: "bg-red-100 text-red-700 hover:bg-red-100",
};

interface ViewPracticeSetItemsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  practiceSet: PracticeSet | null;
  onItemsChanged?: () => void;
}

export function ViewPracticeSetItemsDialog({
  isOpen,
  onOpenChange,
  practiceSet,
  onItemsChanged,
}: ViewPracticeSetItemsDialogProps) {
  const [items, setItems] = useState<PracticeSetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Add question mode
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [addingQuestionId, setAddingQuestionId] = useState<number | null>(null);

  // Auto-generate mode
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [easyCnt, setEasyCnt] = useState(0);
  const [mediumCnt, setMediumCnt] = useState(0);
  const [hardCnt, setHardCnt] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadItems = useCallback(async () => {
    if (!practiceSet?.id) return;
    setLoading(true);
    try {
      const response = await practiceSetItemManager.getByPracticeSetId(practiceSet.id);
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        toast.error(response.error || "Không thể tải danh sách câu hỏi");
      }
    } catch (error) {
      console.error("Error loading practice set items:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [practiceSet?.id]);

  const loadAllQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const response = await questionManager.getAll();
      if (response.success && response.data) {
        const raw = response.data;
        const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
        setAllQuestions(arr as unknown as PracticeQuestion[]);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && practiceSet?.id) {
      loadItems();
    } else {
      setItems([]);
      setShowAddPanel(false);
      setShowAutoGenerate(false);
      setSearchQuery("");
      setLevelFilter("all");
    }
  }, [isOpen, practiceSet?.id, loadItems]);

  // IDs of questions already in the set
  const existingQuestionIds = useMemo(
    () => new Set(items.map((item) => item.practiceQuestion?.questionId).filter(Boolean)),
    [items]
  );

  // Filtered available questions (not already in the set)
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // Exclude already-added questions
      if (existingQuestionIds.has(q.questionId)) return false;
      // Search filter
      if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        if (!q.title?.toLowerCase().includes(lower) && !q.content?.toLowerCase().includes(lower))
          return false;
      }
      // Level filter
      if (levelFilter !== "all" && q.level !== levelFilter) return false;
      return true;
    });
  }, [allQuestions, existingQuestionIds, searchQuery, levelFilter]);

  const handleRemoveItem = async (itemId: number) => {
    setRemovingId(itemId);
    try {
      const response = await practiceSetItemManager.delete(itemId);
      if (response.success) {
        toast.success("Đã xóa câu hỏi khỏi bộ luyện tập");
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        onItemsChanged?.();
      } else {
        toast.error(response.error || "Không thể xóa câu hỏi");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Không thể xóa câu hỏi");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddQuestion = async (question: PracticeQuestion) => {
    if (!practiceSet?.id || !question.questionId) return;
    setAddingQuestionId(question.questionId);
    try {
      const response = await practiceSetItemManager.create({
        practiceQuestion: question,
        practiceSet: { id: practiceSet.id },
        orderIndex: items.length + 1,
      });
      if (response.success) {
        toast.success("Đã thêm câu hỏi vào bộ luyện tập");
        await loadItems();
        onItemsChanged?.();
      } else {
        toast.error(response.error || "Không thể thêm câu hỏi");
      }
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Không thể thêm câu hỏi");
    } finally {
      setAddingQuestionId(null);
    }
  };

  const handleAutoGenerate = async () => {
    if (!practiceSet?.id) return;
    const total = easyCnt + mediumCnt + hardCnt;
    if (total === 0) {
      toast.error("Vui lòng chọn số lượng câu hỏi");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await practiceSetItemManager.createBulk(
        { id: practiceSet.id } as PracticeSet,
        { easy: easyCnt, medium: mediumCnt, hard: hardCnt }
      );
      if (response.success) {
        toast.success(`Đã tạo ${total} câu hỏi tự động`);
        await loadItems();
        onItemsChanged?.();
        setShowAutoGenerate(false);
        setEasyCnt(0);
        setMediumCnt(0);
        setHardCnt(0);
      } else {
        toast.error(response.error || "Không thể tạo câu hỏi tự động");
      }
    } catch (error) {
      console.error("Error auto-generating:", error);
      toast.error("Không thể tạo câu hỏi tự động");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenAddPanel = () => {
    setShowAddPanel(true);
    setShowAutoGenerate(false);
    if (allQuestions.length === 0) {
      loadAllQuestions();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý câu hỏi — {practiceSet?.practiceSetName}</DialogTitle>
          <DialogDescription>
            Thêm, xóa hoặc tự động tạo câu hỏi cho bộ luyện tập này.
          </DialogDescription>
        </DialogHeader>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpenAddPanel}>
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setShowAutoGenerate(!showAutoGenerate);
              setShowAddPanel(false);
            }}>
            <Wand2 className="h-4 w-4" />
            Tạo tự động
          </Button>
        </div>

        {/* Auto-generate panel */}
        {showAutoGenerate && (
          <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <p className="mb-3 text-sm font-medium">Tự động thêm câu hỏi theo độ khó</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Easy</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={easyCnt}
                  onChange={(e) => setEasyCnt(Math.max(0, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Medium</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={mediumCnt}
                  onChange={(e) => setMediumCnt(Math.max(0, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hard</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={hardCnt}
                  onChange={(e) => setHardCnt(Math.max(0, Number(e.target.value)))}
                  className="h-8"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleAutoGenerate}
              disabled={isGenerating || easyCnt + mediumCnt + hardCnt === 0}>
              {isGenerating ? (
                <>
                  <Spinner size="xs" className="mr-1.5" />
                  Đang tạo...
                </>
              ) : (
                `Tạo ${easyCnt + mediumCnt + hardCnt} câu hỏi`
              )}
            </Button>
          </div>
        )}

        {/* Add question panel */}
        {showAddPanel && (
          <div className="rounded-lg border border-dashed border-green-300 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
            <p className="mb-3 text-sm font-medium">Chọn câu hỏi từ ngân hàng</p>
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Tìm câu hỏi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-8 w-28 text-sm">
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
            {questionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="md" tone="muted" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Không tìm thấy câu hỏi phù hợp
              </p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {filteredQuestions.slice(0, 20).map((q) => (
                  <div
                    key={q.questionId}
                    className="flex items-center justify-between gap-2 rounded border bg-white px-3 py-2 dark:bg-slate-900">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{q.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge
                          className={`text-xs ${questionLevelBadgeMap[q.level || ""] || "bg-gray-100 text-gray-700"}`}>
                          {q.level}
                        </Badge>
                        {q.lesson?.lessonName && (
                          <span className="text-muted-foreground text-xs">
                            {q.lesson.lessonName}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 gap-1 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleAddQuestion(q)}
                      disabled={addingQuestionId === q.questionId}>
                      {addingQuestionId === q.questionId ? (
                        <Spinner size="xs" />
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Thêm
                        </>
                      )}
                    </Button>
                  </div>
                ))}
                {filteredQuestions.length > 20 && (
                  <p className="text-muted-foreground pt-1 text-center text-xs">
                    Hiển thị 20/{filteredQuestions.length} câu hỏi. Hãy tìm kiếm để thu hẹp.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current items list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            Chưa có câu hỏi nào trong bộ luyện tập này
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {items.length} câu hỏi trong bộ luyện tập
            </p>
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/50">
                <span className="text-muted-foreground mt-0.5 text-sm font-medium">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-foreground text-sm font-medium">
                      {item.practiceQuestion?.title || "Không có tiêu đề"}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        className={`text-xs ${
                          questionLevelBadgeMap[item.practiceQuestion?.level || ""] ||
                          "bg-gray-100 text-gray-700"
                        }`}>
                        {item.practiceQuestion?.level || "-"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => item.id && handleRemoveItem(item.id)}
                        disabled={removingId === item.id}
                        title="Xóa khỏi bộ luyện tập">
                        {removingId === item.id ? (
                          <Spinner size="xs" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {item.practiceQuestion?.content && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {item.practiceQuestion.content}
                    </p>
                  )}
                  {item.practiceQuestion?.lesson?.lessonName && (
                    <Badge variant="secondary" className="mt-1.5 text-xs">
                      {item.practiceQuestion.lesson.lessonName}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
