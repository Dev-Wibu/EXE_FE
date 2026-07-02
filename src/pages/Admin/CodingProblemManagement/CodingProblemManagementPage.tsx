import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { codingProblemManager, type CodingProblem } from "@/services/coding-problem.manager";
import { Loader2, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CodingProblemTable } from "./components/CodingProblemTable";
import { CodingProblemEditor } from "./components/editor/CodingProblemEditor";

type Difficulty = "ALL" | "EASY" | "MEDIUM" | "HARD";
type SortKey = "newest" | "oldest" | "title_asc" | "title_desc";

export function CodingProblemManagementPage() {
  const { t } = useTranslation();
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Editor state
  const [isAuthoring, setIsAuthoring] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Partial<CodingProblem> | null>(null);

  // Filter / search state
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("ALL");
  const [sort, setSort] = useState<SortKey>("newest");

  // AI Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [aiJobTitle, setAiJobTitle] = useState("");
  const [aiRequirement, setAiRequirement] = useState("");
  const [aiPrompting, setAiPrompting] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProblems = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await codingProblemManager.getAll();
      if (res.success && res.data) setProblems(res.data);
      else toast.error(res.error || t("problem.loadCodingListFailed"));
    } catch {
      toast.error(t("compCodingSubmissionModal.errorOccurred"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleStatus = async (problem: CodingProblem, isActive: boolean) => {
    // Optimistic UI update
    setProblems((prev) =>
      prev.map((p) => (p.id === problem.id ? { ...p, isDeleted: !isActive } : p))
    );
    try {
      // isDeleted is the opposite of isActive
      // Send the full object since it shares the main update endpoint
      const res = await codingProblemManager.update(problem.id, {
        ...problem,
        isDeleted: !isActive,
      });
      if (!res.success) {
        toast.error(res.error || "Không thể cập nhật trạng thái");
        // Revert on failure
        setProblems((prev) =>
          prev.map((p) => (p.id === problem.id ? { ...p, isDeleted: problem.isDeleted } : p))
        );
      } else {
        toast.success(`Đã ${isActive ? "bật" : "tắt"} bài tập`);
      }
    } catch {
      toast.error("Lỗi xảy ra khi cập nhật trạng thái");
      setProblems((prev) =>
        prev.map((p) => (p.id === problem.id ? { ...p, isDeleted: problem.isDeleted } : p))
      );
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      toast.error("Vui lòng nhập chủ đề bài tập");
      return;
    }
    setAiLoading(true);
    try {
      const res = await codingProblemManager.generate({
        topic: aiTopic,
        difficulty: aiDifficulty,
        targetLevel: "INTERMEDIATE",
        context: {
          jobTitle: aiJobTitle.trim() || undefined,
          requirement: aiRequirement.trim() || undefined,
          prompting: aiPrompting.trim() || undefined,
        },
      });
      if (res.success && res.data) {
        toast.success("Tạo tự động thành công!");
        setIsAiModalOpen(false);
        // Start authoring with AI generated data
        setEditingProblem(res.data);
        setIsAuthoring(true);
      } else {
        toast.error(res.error || "Tạo thất bại");
      }
    } catch {
      toast.error("Lỗi xảy ra trong quá trình tạo");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredProblems = useMemo(() => {
    let list = [...problems];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q));
    }
    if (difficulty !== "ALL") {
      list = list.filter((p) => p.difficulty === difficulty);
    }
    switch (sort) {
      case "newest":
        list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
      case "oldest":
        list.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        break;
      case "title_asc":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    return list;
  }, [problems, query, difficulty, sort]);

  // ── Editor flow ──────────────────────────────────────────────────────────────
  if (isAuthoring) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-50 dark:bg-slate-950">
        <CodingProblemEditor
          initialData={editingProblem}
          onBack={() => {
            setIsAuthoring(false);
            setEditingProblem(null);
          }}
          onSaved={() => {
            setIsAuthoring(false);
            setEditingProblem(null);
            fetchProblems(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      {/* ── TOOLBAR ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        {/* Left: Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm bài tập..."
              className="h-8 border-slate-200 pl-9 text-xs focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-4 dark:border-slate-700">
            {(["ALL", "EASY", "MEDIUM", "HARD"] as Difficulty[]).map((d) => {
              const count =
                d === "ALL" ? problems.length : problems.filter((p) => p.difficulty === d).length;
              const isActive = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    isActive
                      ? d === "ALL"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : d === "EASY"
                          ? "bg-emerald-600 text-white"
                          : d === "MEDIUM"
                            ? "bg-amber-500 text-white"
                            : "bg-rose-600 text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}>
                  {d === "ALL" ? "Tất cả" : d}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Sort & Actions */}
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-[140px] border-slate-200 text-xs dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">
                Mới nhất trước
              </SelectItem>
              <SelectItem value="oldest" className="text-xs">
                Cũ nhất trước
              </SelectItem>
              <SelectItem value="title_asc" className="text-xs">
                Tiêu đề A → Z
              </SelectItem>
              <SelectItem value="title_desc" className="text-xs">
                Tiêu đề Z → A
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchProblems(true)}
              disabled={isRefreshing}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <Button
              variant="outline"
              onClick={() => setIsAiModalOpen(true)}
              className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Tạo AI
            </Button>
            <Button
              onClick={() => {
                setEditingProblem(null);
                setIsAuthoring(true);
              }}
              className="h-8 bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Thêm Bài Tập
            </Button>
          </div>
        </div>
      </div>

      {/* ── TABLE CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">Đang tải danh sách bài tập…</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Result count when filtered */}
            {(query || difficulty !== "ALL") && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Hiển thị{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {filteredProblems.length}
                  </strong>{" "}
                  / <strong>{problems.length}</strong> kết quả
                </span>
                <button
                  onClick={() => {
                    setQuery("");
                    setDifficulty("ALL");
                  }}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                  Xóa bộ lọc
                </button>
              </div>
            )}
            <CodingProblemTable
              problems={filteredProblems}
              onEdit={(p) => {
                setEditingProblem(p);
                setIsAuthoring(true);
              }}
              onDelete={undefined}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        )}
      </div>

      {/* ── AI GENERATE MODAL ───────────────────────────────────────────────── */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-2xl">
          {/* Header section */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <Sparkles className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Tạo Đề Bài Tự Động
                </DialogTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Cung cấp chủ đề và ngữ cảnh, AI của chúng tôi sẽ thiết kế một đề bài hoàn chỉnh
                  gồm mô tả, test cases và giới hạn cấu hình.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 bg-white md:grid-cols-2 dark:bg-slate-900">
            {/* Left Column: Essential Info */}
            <div className="space-y-5 border-b border-slate-100 p-6 md:border-r md:border-b-0 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Thông tin bắt buộc
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Chủ đề bài toán
                </label>
                <Input
                  placeholder="VD: Quy hoạch động, Đồ thị..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="h-10 border-slate-200 bg-white focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Độ khó mong muốn
                </label>
                <Select
                  value={aiDifficulty}
                  onValueChange={(v: "EASY" | "MEDIUM" | "HARD") => setAiDifficulty(v)}>
                  <SelectTrigger className="h-10 border-slate-200 bg-white focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Dễ (EASY)</SelectItem>
                    <SelectItem value="MEDIUM">Trung bình (MEDIUM)</SelectItem>
                    <SelectItem value="HARD">Khó (HARD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                <p className="text-sm leading-relaxed text-indigo-700 dark:text-indigo-300">
                  <strong className="mb-1 block font-semibold">Mẹo nhỏ:</strong>
                  Bạn có thể chỉ cần nhập chủ đề. Phần ngữ cảnh nâng cao bên phải là không bắt buộc
                  nhưng sẽ giúp AI tạo đề thi sát với thực tế dự án hơn.
                </p>
              </div>
            </div>

            {/* Right Column: Advanced Context */}
            <div className="space-y-5 bg-slate-50/30 p-6 dark:bg-slate-900/30">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Ngữ cảnh tuỳ chỉnh <span className="font-normal text-slate-500">(Tuỳ chọn)</span>
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Vị trí tuyển dụng
                </label>
                <Input
                  placeholder="VD: Backend Developer, Data Engineer"
                  value={aiJobTitle}
                  onChange={(e) => setAiJobTitle(e.target.value)}
                  className="h-10 border-slate-200 bg-white focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Yêu cầu kỹ năng
                </label>
                <Input
                  placeholder="VD: Tối ưu O(N), xử lý Concurrency..."
                  value={aiRequirement}
                  onChange={(e) => setAiRequirement(e.target.value)}
                  className="h-10 border-slate-200 bg-white focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ghi chú riêng cho AI
                </label>
                <textarea
                  placeholder="Nhập bất cứ yêu cầu đặc biệt nào (VD: Đề bài yêu cầu dùng mảng 2 chiều, kèm nhiều test case bẫy...)"
                  value={aiPrompting}
                  onChange={(e) => setAiPrompting(e.target.value)}
                  className="h-24 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white p-4 px-6 dark:border-slate-800 dark:bg-slate-950">
            <Button
              variant="ghost"
              onClick={() => setIsAiModalOpen(false)}
              disabled={aiLoading}
              className="h-9 px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              Huỷ
            </Button>
            <Button
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="h-9 rounded-md bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang sinh đề thi...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Bắt đầu tạo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
