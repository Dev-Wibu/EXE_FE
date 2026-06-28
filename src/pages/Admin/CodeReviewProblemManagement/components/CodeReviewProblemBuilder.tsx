import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  codeReviewProblemManager,
  type CodeFile,
  type CodeReviewProblem,
  type ExpectedIssue,
} from "@/services/code-review-problem.manager";
import Editor from "@monaco-editor/react";
import {
  Bug,
  ChevronDown,
  Code2,
  FileCode2,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

function StyledSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (_v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white py-1 pr-8 pl-3 text-xs shadow-sm transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

export function CodeReviewProblemBuilder({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [creationMode, setCreationMode] = React.useState<"ai" | "manual">("manual");
  const [aiGeneratedLoaded, setAiGeneratedLoaded] = React.useState(true);
  const [createTabMode, setCreateTabMode] = React.useState<"code" | "issues">("code");

  const [createActiveFileIdx, setCreateActiveFileIdx] = React.useState<number>(0);

  const [newProblem, setNewProblem] = React.useState<{
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    language: string;
    problemStatement: string;
    files: CodeFile[];
    expectedIssues: ExpectedIssue[];
  }>({
    title: "",
    difficulty: "EASY",
    language: "Java",
    problemStatement: "",
    files: [{ filename: "Solution.java", content: "", language: "java" }],
    expectedIssues: [],
  });

  // AI states
  const [aiTopic, setAiTopic] = React.useState("");
  const [aiLevel, setAiLevel] = React.useState("Junior");
  const [aiDifficulty, setAiDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [aiLanguage, setAiLanguage] = React.useState("Java");
  const [aiRequirement, setAiRequirement] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleAddFile = () => {
    const ext = newProblem.language === "Java" ? "java" : newProblem.language.toLowerCase();
    const filename = `File${newProblem.files.length + 1}.${ext}`;
    setNewProblem((prev) => ({
      ...prev,
      files: [...prev.files, { filename, content: "", language: ext }],
    }));
    setCreateActiveFileIdx(newProblem.files.length);
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error("Vui lòng nhập chủ đề / lỗi bảo mật");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await codeReviewProblemManager.generate({
        topic: aiTopic,
        targetLevel: aiLevel,
        programmingLanguage: aiLanguage,
        context: {
          jobTitle: aiLevel,
          requirement: aiRequirement || undefined,
        },
      });
      if (response.success && response.data) {
        const data = response.data as Partial<CodeReviewProblem>;
        setNewProblem({
          title: data.title || "",
          difficulty: aiDifficulty,
          language: data.language || aiLanguage,
          problemStatement: data.problemStatement || "",
          files: data.files || [],
          expectedIssues: data.expectedIssues || [],
        });
        setAiGeneratedLoaded(true);
        setCreationMode("manual");
        setCreateTabMode("code");

        setCreateActiveFileIdx(0);
        toast.success("Đã sinh đề bài Code Review thành công");
      } else {
        toast.error(response.error || "Tạo bài tập thất bại");
      }
    } catch {
      toast.error("Tạo bài tập thất bại");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!newProblem.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài tập");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<CodeReviewProblem> = {
        title: newProblem.title.trim(),
        difficulty: newProblem.difficulty,
        language: newProblem.language.trim() || undefined,
        problemStatement: newProblem.problemStatement.trim() || undefined,
        files: newProblem.files.length > 0 ? newProblem.files : undefined,
        expectedIssues:
          newProblem.expectedIssues.length > 0 ? newProblem.expectedIssues : undefined,
      };
      const response = await codeReviewProblemManager.create(payload);
      if (response.success) {
        toast.success("Tạo bài tập thành công");
        onSuccess();
      } else {
        toast.error(response.error || "Không thể lưu bài tập");
      }
    } catch {
      toast.error("Không thể lưu bài tập");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex w-[380px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2 font-sans text-sm font-bold text-slate-700 dark:text-slate-200">
            <Settings className="h-4 w-4 text-emerald-500" />
            Thiết lập bài toán
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 font-sans text-xs">
            <div>
              <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                Tiêu đề bài *
              </Label>
              <Input
                value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                placeholder="Ví dụ: Rò rỉ API Token"
                className="mt-1 h-8 border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Ngôn ngữ
                </Label>
                <StyledSelect
                  value={newProblem.language}
                  className="mt-1"
                  onChange={(v) => setNewProblem({ ...newProblem, language: v })}>
                  <option value="Java">Java</option>
                  <option value="Javascript">Javascript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="C#">C#</option>
                  <option value="SQL">SQL</option>
                  <option value="Go">Go</option>
                </StyledSelect>
              </div>
              <div>
                <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Độ khó
                </Label>
                <StyledSelect
                  value={newProblem.difficulty}
                  className="mt-1"
                  onChange={(v) =>
                    setNewProblem({ ...newProblem, difficulty: v as "EASY" | "MEDIUM" | "HARD" })
                  }>
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </StyledSelect>
              </div>
            </div>
            <div>
              <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                Yêu cầu / Ngữ cảnh
              </Label>
              <textarea
                value={newProblem.problemStatement}
                onChange={(e) => setNewProblem({ ...newProblem, problemStatement: e.target.value })}
                rows={5}
                placeholder="Mô tả ngữ cảnh và mục tiêu đề..."
                className="mt-1 flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={submitting || isGenerating}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lưu bài tập
          </Button>
        </div>
      </div>

      {/* RIGHT PANE - IDE WORKSPACE */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-slate-950/20 dark:bg-slate-950">
        {isGenerating && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="text-xs font-semibold text-slate-300">
                AI đang sinh đề bài Code Review, vui lòng chờ trong giây lát...
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <Plus className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Thiết kế đề Code Review mới</h3>
            <div className="rounded-lg bg-slate-900 p-0.5">
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode("ai");
                    setAiGeneratedLoaded(false);
                  }}
                  className={cn(
                    "rounded px-2.5 py-1 text-[10px] font-bold transition-all",
                    creationMode === "ai" ? "bg-slate-800 text-indigo-400" : "text-slate-400"
                  )}>
                  ✨ Sinh bằng AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode("manual");
                    setAiGeneratedLoaded(true);
                  }}
                  className={cn(
                    "rounded px-2.5 py-1 text-[10px] font-bold transition-all",
                    creationMode === "manual" ? "bg-slate-800 text-indigo-400" : "text-slate-400"
                  )}>
                  ✏️ Thủ công
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {creationMode === "ai" && !aiGeneratedLoaded ? (
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-900 p-6 font-sans text-slate-100">
              <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-sm">
                <div className="mb-8 flex flex-col items-center space-y-4 text-center">
                  <div className="relative inline-flex items-center justify-center rounded-2xl border border-indigo-800/40 bg-indigo-950/40 p-4 text-indigo-400 shadow-inner">
                    <Sparkles className="h-10 w-10 animate-pulse text-indigo-400" />
                    <Wand2 className="absolute -top-1 -right-1 h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-wide text-white">
                      Thiết Kế Đề Bài Bằng Trí Tuệ Nhân Tạo (AI)
                    </h3>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                      Nhập các tham số thiết kế bên dưới. AI sẽ tự động tạo cấu trúc các file source
                      code chứa lỗi logic/bảo mật, đồng thời thiết lập các bình luận chỉ định lỗi
                      review mẫu.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      Chủ đề / Lỗi bảo mật cần review *
                    </Label>
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                      placeholder="Ví dụ: Rò rỉ thông tin qua log, SQL Injection, N+1 Query..."
                      className="mt-1.5 h-10 border-slate-800 bg-slate-950/60 px-3 text-xs text-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Độ khó
                      </Label>
                      <StyledSelect
                        value={aiDifficulty}
                        className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                        onChange={(v) => setAiDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                      </StyledSelect>
                    </div>
                    <div>
                      <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Ngôn ngữ
                      </Label>
                      <StyledSelect
                        value={aiLanguage}
                        className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                        onChange={setAiLanguage}>
                        <option value="Java">Java</option>
                        <option value="Javascript">Javascript</option>
                        <option value="TypeScript">TypeScript</option>
                        <option value="Python">Python</option>
                        <option value="C#">C#</option>
                        <option value="SQL">SQL</option>
                        <option value="Go">Go</option>
                      </StyledSelect>
                    </div>
                    <div>
                      <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        Cấp độ ứng viên
                      </Label>
                      <StyledSelect
                        value={aiLevel}
                        className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                        onChange={setAiLevel}>
                        <option value="Intern">Intern</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                      </StyledSelect>
                    </div>
                  </div>
                  <div>
                    <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      Yêu cầu bổ sung
                    </Label>
                    <textarea
                      value={aiRequirement}
                      onChange={(e) => setAiRequirement(e.target.value)}
                      rows={4}
                      placeholder="Mô tả context dự án hoặc hướng dẫn đặc biệt cho AI..."
                      className="border-slate-850 mt-1.5 flex w-full rounded-md border bg-slate-950/60 px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isGenerating || !aiTopic}
                    onClick={handleAiGenerate}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-sans text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Sparkles className="h-4 w-4" />
                    Bắt đầu sinh đề bài với AI
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/60">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-3">
                <div className="flex gap-1.5 font-sans">
                  <button
                    type="button"
                    onClick={() => setCreateTabMode("code")}
                    className={cn(
                      "px-3 py-2 text-xs font-bold transition-all",
                      createTabMode === "code"
                        ? "border-b-2 border-b-indigo-500 text-indigo-400"
                        : "text-slate-400 hover:text-slate-200"
                    )}>
                    <Code2 className="mr-1 inline-block h-3.5 w-3.5" /> Code Files (
                    {newProblem.files.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateTabMode("issues")}
                    className={cn(
                      "px-3 py-2 text-xs font-bold transition-all",
                      createTabMode === "issues"
                        ? "border-b-2 border-b-indigo-500 text-indigo-400"
                        : "text-slate-400 hover:text-slate-200"
                    )}>
                    <Bug className="mr-1 inline-block h-3.5 w-3.5" /> Lỗi cần bắt (
                    {newProblem.expectedIssues.length})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {createTabMode === "code" ? (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2 py-1.5">
                      <div className="flex flex-1 overflow-x-auto">
                        {newProblem.files.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className={cn(
                              "group flex items-center gap-1.5 border-r border-slate-800 px-3 py-1.5 transition-colors",
                              createActiveFileIdx === fIdx
                                ? "bg-slate-800/80 text-white"
                                : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                            )}>
                            <button
                              type="button"
                              onClick={() => setCreateActiveFileIdx(fIdx)}
                              className="flex items-center gap-1.5 text-xs font-medium">
                              <FileCode2
                                className={cn(
                                  "h-3.5 w-3.5",
                                  createActiveFileIdx === fIdx ? "text-indigo-400" : ""
                                )}
                              />
                              {f.filename || "Untitled"}
                            </button>
                            {newProblem.files.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewProblem((prev) => ({
                                    ...prev,
                                    files: prev.files.filter((_, idx) => idx !== fIdx),
                                  }));
                                  if (createActiveFileIdx >= fIdx && createActiveFileIdx > 0) {
                                    setCreateActiveFileIdx(createActiveFileIdx - 1);
                                  }
                                }}
                                className="ml-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-700">
                                <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-400" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleAddFile}
                        className="h-7 w-7 shrink-0 text-slate-400 hover:bg-slate-800 hover:text-white">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-1 flex-col">
                      {newProblem.files[createActiveFileIdx] && (
                        <div className="flex flex-1 flex-col p-4">
                          <div className="mb-3 grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Tên File
                              </Label>
                              <Input
                                value={newProblem.files[createActiveFileIdx].filename}
                                onChange={(e) => {
                                  const files = [...newProblem.files];
                                  files[createActiveFileIdx].filename = e.target.value;
                                  setNewProblem({ ...newProblem, files });
                                }}
                                className="mt-1 h-8 border-slate-800 bg-slate-900 text-xs text-white focus-visible:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Ngôn ngữ highlight
                              </Label>
                              <Input
                                value={newProblem.files[createActiveFileIdx].language}
                                onChange={(e) => {
                                  const files = [...newProblem.files];
                                  files[createActiveFileIdx].language = e.target.value;
                                  setNewProblem({ ...newProblem, files });
                                }}
                                className="mt-1 h-8 border-slate-800 bg-slate-900 text-xs text-white focus-visible:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-md border border-slate-800">
                            <Editor
                              height="100%"
                              language={(
                                newProblem.files[createActiveFileIdx]?.language || "java"
                              ).toLowerCase()}
                              value={newProblem.files[createActiveFileIdx]?.content || ""}
                              theme="vs-dark"
                              options={{
                                readOnly: false,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                lineNumbers: "on",
                                folding: true,
                                wordWrap: "on",
                                padding: { top: 12, bottom: 12 },
                                scrollbar: {
                                  verticalScrollbarSize: 6,
                                  horizontalScrollbarSize: 6,
                                },
                                renderLineHighlight: "line",
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                contextmenu: false,
                                glyphMargin: false,
                              }}
                              onChange={(value) => {
                                const files = [...newProblem.files];
                                files[createActiveFileIdx].content = value || "";
                                setNewProblem({ ...newProblem, files });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Danh sách Expected Issues
                        </h4>
                        <p className="text-xs text-slate-400">
                          Định nghĩa các lỗi ứng viên cần phải tìm ra.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setNewProblem({
                            ...newProblem,
                            expectedIssues: [
                              ...newProblem.expectedIssues,
                              {
                                filename: newProblem.files[0]?.filename || "Solution.java",
                                lineNumber: 1,
                                severity: "CRITICAL",
                                description: "",
                              },
                            ],
                          })
                        }
                        className="h-8 bg-indigo-600 text-xs hover:bg-indigo-700">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Thêm Lỗi Mẫu
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {newProblem.expectedIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                          <button
                            type="button"
                            onClick={() => {
                              setNewProblem({
                                ...newProblem,
                                expectedIssues: newProblem.expectedIssues.filter(
                                  (_, i) => i !== idx
                                ),
                              });
                            }}
                            className="absolute top-2 right-2 rounded p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="mb-3 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                              {idx + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 sm:col-span-5">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Tên file
                              </Label>
                              <StyledSelect
                                value={issue.filename || ""}
                                className="mt-1"
                                onChange={(v) => {
                                  const next = [...newProblem.expectedIssues];
                                  next[idx].filename = v;
                                  setNewProblem({ ...newProblem, expectedIssues: next });
                                }}>
                                {newProblem.files.map((f, fi) => (
                                  <option key={fi} value={f.filename || ""}>
                                    {f.filename || `File ${fi + 1}`}
                                  </option>
                                ))}
                              </StyledSelect>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Dòng số
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                value={issue.lineNumber}
                                onChange={(e) => {
                                  const next = [...newProblem.expectedIssues];
                                  next[idx].lineNumber = Number(e.target.value);
                                  setNewProblem({ ...newProblem, expectedIssues: next });
                                }}
                                className="mt-1 h-9 border-slate-800 bg-slate-950 text-xs text-white"
                              />
                            </div>
                            <div className="col-span-6 sm:col-span-4">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Mức độ (Severity)
                              </Label>
                              <StyledSelect
                                value={issue.severity || ""}
                                className="mt-1"
                                onChange={(v) => {
                                  const next = [...newProblem.expectedIssues];
                                  next[idx].severity = v as "CRITICAL" | "WARNING" | "INFO";
                                  setNewProblem({ ...newProblem, expectedIssues: next });
                                }}>
                                <option value="CRITICAL">CRITICAL</option>
                                <option value="WARNING">WARNING</option>
                                <option value="INFO">INFO</option>
                              </StyledSelect>
                            </div>
                            <div className="col-span-12">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                                Mô tả lỗi (Description)
                              </Label>
                              <textarea
                                value={issue.description}
                                onChange={(e) => {
                                  const next = [...newProblem.expectedIssues];
                                  next[idx].description = e.target.value;
                                  setNewProblem({ ...newProblem, expectedIssues: next });
                                }}
                                rows={2}
                                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Giải thích lỗi gì và cách khắc phục..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {newProblem.expectedIssues.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-slate-500">
                          <Bug className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-sm">Chưa có lỗi mẫu nào được định nghĩa.</p>
                          <p className="mt-1 text-xs">Hãy nhấn "Thêm Lỗi Mẫu" để bắt đầu.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
