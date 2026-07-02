import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { codingProblemManager, type CodingProblem } from "@/services/coding-problem.manager";
import {
  BookOpen,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
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
      const res = await codingProblemManager.update(problem.id, { ...problem, isDeleted: !isActive });
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
        }
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

  const stats = useMemo(
    () => ({
      total: problems.length,
      easy: problems.filter((p) => p.difficulty === "EASY" && !p.isDeleted).length,
      medium: problems.filter((p) => p.difficulty === "MEDIUM" && !p.isDeleted).length,
      hard: problems.filter((p) => p.difficulty === "HARD" && !p.isDeleted).length,
      active: problems.filter((p) => !p.isDeleted).length,
    }),
    [problems]
  );

  // ── Editor flow ──────────────────────────────────────────────────────────────
  if (isAuthoring) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-50 dark:bg-slate-950">
        <CodingProblemEditor
          initialData={editingProblem}
          onBack={() => { setIsAuthoring(false); setEditingProblem(null); }}
          onSaved={() => { setIsAuthoring(false); setEditingProblem(null); fetchProblems(true); }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-500/30">
              <BookOpen className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Quản lý Bài thi Coding
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Danh sách bài tập thuật toán dùng trong vòng đánh giá lập trình
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProblems(true)}
              disabled={isRefreshing}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-1.5 ml-2">
              <Button
                variant="outline"
                onClick={() => setIsAiModalOpen(true)}
                className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Tạo AI
              </Button>
              <Button
                onClick={() => { setEditingProblem(null); setIsAuthoring(true); }}
                className="h-8 bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Thêm Bài Tập
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-4 flex items-center gap-3">
          {[
            { label: "Tổng cộng", value: stats.total, cls: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800" },
            { label: "Đang bật", value: stats.active, cls: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Easy", value: stats.easy, cls: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Medium", value: stats.medium, cls: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Hard", value: stats.hard, cls: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 ${s.bg}`}>
              <span className={`text-base font-bold tabular-nums ${s.cls}`}>{s.value}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER BAR ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên bài tập…"
            className="h-8 border-slate-200 pl-9 text-xs focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Lọc:</span>
        </div>

        {/* Difficulty filter — pill buttons */}
        <div className="flex items-center gap-1">
          {(["ALL", "EASY", "MEDIUM", "HARD"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                difficulty === d
                  ? d === "ALL" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : d === "EASY" ? "bg-emerald-600 text-white"
                    : d === "MEDIUM" ? "bg-amber-500 text-white"
                    : "bg-rose-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}>
              {d === "ALL" ? "Tất cả" : d}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-44 border-slate-200 text-xs dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">Mới nhất trước</SelectItem>
              <SelectItem value="oldest" className="text-xs">Cũ nhất trước</SelectItem>
              <SelectItem value="title_asc" className="text-xs">Tiêu đề A → Z</SelectItem>
              <SelectItem value="title_desc" className="text-xs">Tiêu đề Z → A</SelectItem>
            </SelectContent>
          </Select>
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
                  <strong className="text-slate-800 dark:text-slate-200">{filteredProblems.length}</strong> /{" "}
                  <strong>{problems.length}</strong> kết quả
                </span>
                <button
                  onClick={() => { setQuery(""); setDifficulty("ALL"); }}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                  Xóa bộ lọc
                </button>
              </div>
            )}
            <CodingProblemTable
              problems={filteredProblems}
              onEdit={(p) => { setEditingProblem(p); setIsAuthoring(true); }}
              onDelete={undefined}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        )}
      </div>

      {/* ── AI GENERATE MODAL ───────────────────────────────────────────────── */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden border-0 shadow-2xl">
          {/* Header section with gradient background */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-8 dark:from-indigo-900 dark:to-violet-950">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Tạo Đề Bài Tự Động
                </DialogTitle>
                <p className="mt-1 text-sm text-indigo-100">
                  Cung cấp chủ đề và ngữ cảnh, AI của chúng tôi sẽ thiết kế một đề bài hoàn chỉnh gồm mô tả, test cases và giới hạn cấu hình.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900">
            {/* Left Column: Essential Info */}
            <div className="p-6 space-y-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Thông tin bắt buộc
                </h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Chủ đề bài toán</label>
                <Input
                  placeholder="VD: Quy hoạch động, Đồ thị..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="h-10 border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Độ khó mong muốn</label>
                <Select value={aiDifficulty} onValueChange={(v: "EASY" | "MEDIUM" | "HARD") => setAiDifficulty(v)}>
                  <SelectTrigger className="h-10 border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50">
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
                <p className="text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300">
                  <strong className="block mb-1">💡 Mẹo nhỏ:</strong>
                  Bạn có thể chỉ cần nhập chủ đề. Phần ngữ cảnh nâng cao bên phải là không bắt buộc nhưng sẽ giúp AI tạo đề thi sát với thực tế dự án hơn.
                </p>
              </div>
            </div>

            {/* Right Column: Advanced Context */}
            <div className="bg-slate-50/50 p-6 space-y-5 dark:bg-slate-900/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Ngữ cảnh tuỳ chỉnh <span className="text-slate-400 font-normal">(Tuỳ chọn)</span>
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Vị trí tuyển dụng</label>
                <Input
                  placeholder="VD: Backend Developer, Data Engineer"
                  value={aiJobTitle}
                  onChange={(e) => setAiJobTitle(e.target.value)}
                  className="h-10 border-slate-200 bg-white focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Yêu cầu kỹ năng</label>
                <Input
                  placeholder="VD: Tối ưu O(N), xử lý Concurrency..."
                  value={aiRequirement}
                  onChange={(e) => setAiRequirement(e.target.value)}
                  className="h-10 border-slate-200 bg-white focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Ghi chú riêng cho AI</label>
                <textarea
                  placeholder="Nhập bất cứ yêu cầu đặc biệt nào (VD: Đề bài yêu cầu dùng mảng 2 chiều, kèm nhiều test case bẫy...)"
                  value={aiPrompting}
                  onChange={(e) => setAiPrompting(e.target.value)}
                  className="h-24 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
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
              className="h-9 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              Huỷ
            </Button>
            <Button
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="group relative h-9 overflow-hidden bg-indigo-600 px-6 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30">
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"></div>
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
