import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { codingProblemManager, type CodingProblem } from "@/services/coding-problem.manager";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Code2,
  FileText,
  Loader2,
  PlaySquare,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_TYPES = [
  "integer",
  "integer[]",
  "integer[][]",
  "long",
  "long[]",
  "double",
  "double[]",
  "String",
  "String[]",
  "boolean",
  "char",
  "char[]",
  "void",
];

function TypeTag({ value }: { value: string }) {
  const colors: Record<string, string> = {
    integer: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    "integer[]": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    "integer[][]": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    String: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "String[]": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    boolean: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    double: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  };
  const cls = colors[value] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${cls}`}>
      {value || "?"}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface CodingProblemEditorProps {
  initialData: Partial<CodingProblem> | null;
  onBack: () => void;
  onSaved: () => void;
}

type TabKey = "general" | "testcases" | "codestubs";

export function CodingProblemEditor({ initialData, onBack, onSaved }: CodingProblemEditorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [isLoadingData, setIsLoadingData] = useState(!!initialData?.id);
  const [formData, setFormData] = useState<Partial<CodingProblem>>({
    title: "",
    difficulty: "MEDIUM",
    problemStatement: "",
    rulesAndConstraints: [],
    paramTypes: [],
    returnType: "",
    visibleExamples: [],
    hiddenTestCases: [],
    executionTimeLimitMs: 2000,
    memoryLimitMb: 256,
    codeStubs: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLang, setActiveLang] = useState("JAVA");
  const [expandedTc, setExpandedTc] = useState<number | null>(null);

  const paramCount = formData.paramTypes?.length || 0;

  useEffect(() => {
    if (initialData?.id) fetchDetails(initialData.id);
    else setFormData((p) => ({ ...p, ...initialData }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const fetchDetails = async (id: number | string) => {
    setIsLoadingData(true);
    try {
      const res = await codingProblemManager.getById(id);
      if (res.success && res.data) setFormData(res.data);
      else {
        toast.error(res.error || "Không thể tải chi tiết.");
        onBack();
      }
    } catch {
      toast.error("Lỗi hệ thống.");
      onBack();
    } finally {
      setIsLoadingData(false);
    }
  };

  const patch = (u: Partial<CodingProblem>) => setFormData((p) => ({ ...p, ...u }));

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.problemStatement?.trim()) {
      toast.error(t("general.pleaseFillAllRequiredFields"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await codingProblemManager.create(formData);
      if (res.success) {
        toast.success(t("general.addSuccess"));
        onSaved();
      } else toast.error(res.error || t("general.addFailed"));
    } catch {
      toast.error(t("compCodingSubmissionModal.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonacoLang = (k: string) =>
    ({
      JAVA: "java",
      PYTHON: "python",
      CPP: "cpp",
      JS: "javascript",
      TYPESCRIPT: "typescript",
      GO: "go",
      CSHARP: "csharp",
      SCALA: "scala",
      SWIFT: "swift",
      KOTLIN: "kotlin",
    })[k] ?? "plaintext";

  const addHiddenTc = () => {
    const list = [
      ...(formData.hiddenTestCases || []),
      { inputs: Array(paramCount).fill(""), expectedOutput: "", weightPoints: 10 },
    ];
    patch({ hiddenTestCases: list });
    setExpandedTc(list.length - 1);
  };
  const removeHiddenTc = (i: number) => {
    const list = [...(formData.hiddenTestCases || [])];
    list.splice(i, 1);
    patch({ hiddenTestCases: list });
    if (expandedTc === i) setExpandedTc(null);
    else if (expandedTc !== null && expandedTc > i) setExpandedTc(expandedTc - 1);
  };
  const updateHiddenTc = (i: number, up: Record<string, unknown>) => {
    const list = [...(formData.hiddenTestCases || [])] as NonNullable<
      CodingProblem["hiddenTestCases"]
    >;
    list[i] = { ...list[i], ...up };
    patch({ hiddenTestCases: list });
  };

  if (isLoadingData)
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Đang tải bài tập…</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* ── TOP BAR ──────────────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {formData.title || "Tạo mới"}
          </span>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          size="sm"
          className="h-7 bg-indigo-600 px-3 text-[11px] font-bold text-white hover:bg-indigo-700">
          {isSubmitting ? (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3 w-3" />
          )}
          Lưu Bài Tập
        </Button>
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: "general", label: "Đề bài", icon: FileText },
          {
            id: "testcases",
            label: "Test Cases",
            icon: PlaySquare,
            badge: formData.hiddenTestCases?.length,
          },
          { id: "codestubs", label: "Code Stubs", icon: Code2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabKey)}
            className={`flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}>
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {"badge" in tab && tab.badge !== undefined && (
              <span
                className={`rounded-full px-1.5 py-px text-[10px] font-bold ${activeTab === tab.id ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* ═══ GENERAL TAB — 2-column layout ══════════════════════════════════ */}
        {activeTab === "general" && (
          <div className="flex h-full">
            {/* LEFT: Markdown editor (primary, takes most space) */}
            <div className="flex flex-1 flex-col overflow-y-auto border-r border-slate-200 dark:border-slate-800">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/50">
                  <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                    Nội dung đề bài (Markdown)
                  </span>
                </div>
                <Textarea
                  value={formData.problemStatement || ""}
                  onChange={(e) => patch({ problemStatement: e.target.value })}
                  placeholder="Mô tả bài toán, gõ Markdown tại đây…"
                  className="flex-1 resize-none rounded-none border-0 bg-white p-5 font-mono text-sm leading-relaxed focus-visible:ring-0 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* RIGHT: Configuration */}
            <div className="flex w-[480px] shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {/* Core Settings: Title, Difficulty, Limits */}
              <div className="space-y-4 border-b border-slate-100 p-5 dark:border-slate-800">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tiêu đề
                  </Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => patch({ title: e.target.value })}
                    className="h-9 border-slate-200 text-sm font-semibold dark:border-slate-700"
                    placeholder="VD: Two Sum"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Độ khó
                    </Label>
                    <Select
                      value={formData.difficulty || "MEDIUM"}
                      onValueChange={(v: "EASY" | "MEDIUM" | "HARD") => patch({ difficulty: v })}>
                      <SelectTrigger
                        className={`h-9 border text-xs font-bold ${
                          formData.difficulty === "EASY"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : formData.difficulty === "HARD"
                              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-400"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-400"
                        }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">EASY</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                        <SelectItem value="HARD">HARD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Thời gian
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.executionTimeLimitMs || 2000}
                        onChange={(e) =>
                          patch({ executionTimeLimitMs: parseInt(e.target.value) || 2000 })
                        }
                        className="h-9 pr-8 font-mono text-xs dark:border-slate-700"
                      />
                      <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-slate-400">
                        ms
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                      Bộ nhớ
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.memoryLimitMb || 256}
                        onChange={(e) => patch({ memoryLimitMb: parseInt(e.target.value) || 256 })}
                        className="h-9 pr-8 font-mono text-xs dark:border-slate-700"
                      />
                      <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-slate-400">
                        MB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Function signature preview */}
                {(paramCount > 0 || formData.returnType) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/50">
                    <TypeTag value={formData.returnType || "?"} />
                    <span className="font-mono text-[11px] text-slate-500">solution(</span>
                    {formData.paramTypes?.map((p, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        <TypeTag value={p} />
                        {i < paramCount - 1 && (
                          <span className="font-mono text-[11px] text-slate-400">,</span>
                        )}
                      </span>
                    ))}
                    <span className="font-mono text-[11px] text-slate-500">)</span>
                  </div>
                )}
              </div>

              {/* Data Signatures */}
              <div className="space-y-5 border-b border-slate-100 p-5 dark:border-slate-800">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Kiểu trả về
                  </Label>
                  <Select
                    value={
                      COMMON_TYPES.includes(formData.returnType || "")
                        ? formData.returnType || ""
                        : "__custom__"
                    }
                    onValueChange={(v) => {
                      if (v !== "__custom__") patch({ returnType: v });
                    }}>
                    <SelectTrigger className="h-9 w-full font-mono text-xs dark:border-slate-700">
                      <SelectValue placeholder="Chọn kiểu…" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="font-mono text-xs">
                          {t}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-xs text-slate-400">
                        Tùy chỉnh…
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {!COMMON_TYPES.includes(formData.returnType || "") && (
                    <Input
                      value={formData.returnType || ""}
                      onChange={(e) => patch({ returnType: e.target.value })}
                      className="h-9 font-mono text-xs dark:border-slate-700"
                      placeholder="VD: TreeNode"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tham số (Params)
                    </Label>
                    <button
                      onClick={() =>
                        patch({ paramTypes: [...(formData.paramTypes || []), "integer"] })
                      }
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                      <Plus className="h-3 w-3" /> Thêm
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {formData.paramTypes?.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-10 text-right font-mono text-xs font-medium text-slate-400">
                          P{i + 1}
                        </span>
                        <Select
                          value={COMMON_TYPES.includes(p) ? p : "__custom__"}
                          onValueChange={(v) => {
                            const l = [...(formData.paramTypes || [])];
                            if (v !== "__custom__") l[i] = v;
                            patch({ paramTypes: l });
                          }}>
                          <SelectTrigger className="h-9 flex-1 font-mono text-xs dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="font-mono text-xs">
                                {t}
                              </SelectItem>
                            ))}
                            <SelectItem value="__custom__" className="text-xs text-slate-400">
                              Tùy chỉnh…
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {!COMMON_TYPES.includes(p) && (
                          <Input
                            value={p}
                            onChange={(e) => {
                              const l = [...(formData.paramTypes || [])];
                              l[i] = e.target.value;
                              patch({ paramTypes: l });
                            }}
                            className="h-9 w-28 font-mono text-xs dark:border-slate-700"
                          />
                        )}
                        <button
                          onClick={() => {
                            const l = [...(formData.paramTypes || [])];
                            l.splice(i, 1);
                            patch({ paramTypes: l });
                          }}
                          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {(!formData.paramTypes || formData.paramTypes.length === 0) && (
                      <div className="rounded-md border border-dashed border-slate-200 py-4 text-center dark:border-slate-800">
                        <p className="text-xs text-slate-400 italic">Chưa có tham số.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Examples */}
              <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ví dụ mẫu
                  </Label>
                  <button
                    onClick={() =>
                      patch({
                        visibleExamples: [
                          ...(formData.visibleExamples || []),
                          { inputs: Array(paramCount).fill(""), output: "", explanation: "" },
                        ],
                      })
                    }
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                    <Plus className="h-3 w-3" /> Thêm
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.visibleExamples?.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Ví dụ {exIdx + 1}
                        </span>
                        <button
                          onClick={() => {
                            const l = [...(formData.visibleExamples || [])];
                            l.splice(exIdx, 1);
                            patch({ visibleExamples: l });
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-3 p-4">
                        {/* Inputs */}
                        <div className="space-y-2">
                          {paramCount === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              Vui lòng khai báo tham số trước.
                            </p>
                          ) : (
                            formData.paramTypes?.map((pt, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <TypeTag value={pt} />
                                <Input
                                  value={ex.inputs?.[pIdx] || ""}
                                  onChange={(e) => {
                                    const l = [...(formData.visibleExamples || [])];
                                    if (!l[exIdx].inputs)
                                      l[exIdx].inputs = Array(paramCount).fill("");
                                    l[exIdx].inputs[pIdx] = e.target.value;
                                    patch({ visibleExamples: l });
                                  }}
                                  className="h-8 flex-1 border-slate-200 font-mono text-xs dark:border-slate-700"
                                  placeholder={`Giá trị ${pt}`}
                                />
                              </div>
                            ))
                          )}
                        </div>
                        {/* Output */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="w-[50px] shrink-0 text-xs font-semibold text-slate-500">
                            Output
                          </span>
                          {formData.returnType && <TypeTag value={formData.returnType} />}
                          <Input
                            value={ex.output || ""}
                            onChange={(e) => {
                              const l = [...(formData.visibleExamples || [])];
                              l[exIdx].output = e.target.value;
                              patch({ visibleExamples: l });
                            }}
                            className="h-8 flex-1 border-slate-200 font-mono text-xs dark:border-slate-700"
                            placeholder="Output"
                          />
                        </div>
                        {/* Explanation */}
                        <Textarea
                          value={ex.explanation || ""}
                          onChange={(e) => {
                            const l = [...(formData.visibleExamples || [])];
                            l[exIdx].explanation = e.target.value;
                            patch({ visibleExamples: l });
                          }}
                          className="h-16 resize-none border-slate-200 text-xs dark:border-slate-700"
                          placeholder="Giải thích (không bắt buộc)…"
                        />
                      </div>
                    </div>
                  ))}
                  {(!formData.visibleExamples || formData.visibleExamples.length === 0) && (
                    <button
                      onClick={() =>
                        patch({
                          visibleExamples: [
                            { inputs: Array(paramCount).fill(""), output: "", explanation: "" },
                          ],
                        })
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 py-6 text-sm font-medium text-slate-400 hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700">
                      <Plus className="h-4 w-4" /> Thêm ví dụ đầu tiên
                    </button>
                  )}
                </div>
              </div>

              {/* Constraints */}
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Điều kiện
                  </Label>
                  <button
                    onClick={() =>
                      patch({ rulesAndConstraints: [...(formData.rulesAndConstraints || []), ""] })
                    }
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                    <Plus className="h-3 w-3" /> Thêm
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.rulesAndConstraints?.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </span>
                      <Input
                        value={rule}
                        onChange={(e) => {
                          const l = [...(formData.rulesAndConstraints || [])];
                          l[idx] = e.target.value;
                          patch({ rulesAndConstraints: l });
                        }}
                        className="h-9 flex-1 border-slate-200 font-mono text-xs dark:border-slate-700"
                        placeholder="2 ≤ n ≤ 10⁴"
                      />
                      <button
                        onClick={() => {
                          const l = [...(formData.rulesAndConstraints || [])];
                          l.splice(idx, 1);
                          patch({ rulesAndConstraints: l });
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!formData.rulesAndConstraints || formData.rulesAndConstraints.length === 0) && (
                    <div className="rounded-md border border-dashed border-slate-200 py-4 text-center dark:border-slate-800">
                      <p className="text-xs text-slate-400 italic">Chưa có điều kiện.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TEST CASES TAB ══════════════════════════════════════════════════ */}
        {activeTab === "testcases" && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Full-width toolbar */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Test Cases Ẩn
                  </p>
                  <p className="text-xs text-slate-500">
                    Dùng để chấm điểm — thí sinh không xem được
                  </p>
                </div>
                {(formData.hiddenTestCases?.length ?? 0) > 0 && (
                  <>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formData.hiddenTestCases?.length}
                        </strong>{" "}
                        test cases
                      </span>
                      <span>
                        Tổng:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formData.hiddenTestCases?.reduce(
                            (s, tc) => s + (tc.weightPoints || 0),
                            0
                          )}
                          đ
                        </strong>
                      </span>
                      {paramCount > 0 && (
                        <span className="flex items-center gap-1">
                          {formData.paramTypes?.map((p, i) => (
                            <TypeTag key={i} value={p} />
                          ))}
                          <span className="text-slate-400">→</span>
                          <TypeTag value={formData.returnType || "?"} />
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={addHiddenTc}
                className="h-8 bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm Test Case
              </Button>
            </div>

            {/* Flat Table list */}
            <div className="flex-1 overflow-y-auto p-6">
              {!formData.hiddenTestCases || formData.hiddenTestCases.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <PlaySquare className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm text-slate-500">Chưa có Test Case nào</p>
                  <Button
                    size="sm"
                    onClick={addHiddenTc}
                    className="h-8 bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm test case đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                      <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                        <tr>
                          <th className="w-16 px-4 py-3 text-center font-semibold">#</th>
                          {paramCount > 0 ? (
                            formData.paramTypes?.map((pt, i) => (
                              <th key={i} className="min-w-[150px] px-4 py-3 font-semibold">
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className="text-xs text-slate-500">Tham số {i + 1}</span>
                                  <TypeTag value={pt} />
                                </div>
                              </th>
                            ))
                          ) : (
                            <th className="min-w-[150px] px-4 py-3 font-semibold text-slate-400 italic">
                              Cần định nghĩa tham số
                            </th>
                          )}
                          <th className="min-w-[200px] px-4 py-3 font-semibold">
                            <div className="flex flex-col items-start gap-1.5">
                              <span className="text-xs text-slate-500">Kết quả kỳ vọng</span>
                              {formData.returnType && <TypeTag value={formData.returnType} />}
                            </div>
                          </th>
                          <th className="w-24 px-4 py-3 text-center font-semibold">Điểm số</th>
                          <th className="w-16 px-4 py-3 text-center font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {formData.hiddenTestCases.map((tc, idx) => (
                          <tr
                            key={idx}
                            className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-4 pt-6 text-center align-top font-mono font-bold text-slate-500">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            {paramCount > 0 ? (
                              formData.paramTypes?.map((pt, pIdx) => (
                                <td key={pIdx} className="px-4 py-4 align-top">
                                  <Textarea
                                    value={tc.inputs?.[pIdx] || ""}
                                    onChange={(e) => {
                                      const inputs = [...(tc.inputs || Array(paramCount).fill(""))];
                                      inputs[pIdx] = e.target.value;
                                      updateHiddenTc(idx, { inputs });
                                    }}
                                    className="h-10 min-h-[40px] resize-y border-slate-200 bg-white font-mono text-sm focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    placeholder="Giá trị..."
                                  />
                                </td>
                              ))
                            ) : (
                              <td className="px-4 py-4"></td>
                            )}
                            <td className="px-4 py-4 align-top">
                              <Textarea
                                value={tc.expectedOutput || ""}
                                onChange={(e) =>
                                  updateHiddenTc(idx, { expectedOutput: e.target.value })
                                }
                                className="h-10 min-h-[40px] resize-y border-slate-200 bg-white font-mono text-sm focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                                placeholder="Output..."
                              />
                            </td>
                            <td className="px-4 py-4 pt-5 align-top">
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={tc.weightPoints ?? 10}
                                  onChange={(e) =>
                                    updateHiddenTc(idx, {
                                      weightPoints: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="h-10 w-20 border-slate-200 bg-emerald-50/50 text-center font-mono font-bold text-emerald-700 dark:border-slate-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 pt-6 text-center align-top">
                              <button
                                onClick={() => removeHiddenTc(idx)}
                                className="rounded p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CODE STUBS TAB ═════════════════════════════════════════════════ */}
        {activeTab === "codestubs" && (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Mã nguồn Mẫu</p>
                <p className="text-xs text-slate-500">
                  Hiển thị cho thí sinh khi mở bài trên trình biên dịch.
                </p>
              </div>
              <Select value={activeLang} onValueChange={setActiveLang}>
                <SelectTrigger className="h-8 w-40 border-slate-200 text-xs font-semibold dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ["JAVA", "Java"],
                    ["PYTHON", "Python"],
                    ["CPP", "C++"],
                    ["JS", "JavaScript"],
                    ["TYPESCRIPT", "TypeScript"],
                    ["GO", "Go"],
                    ["CSHARP", "C#"],
                    ["SCALA", "Scala"],
                    ["SWIFT", "Swift"],
                    ["KOTLIN", "Kotlin"],
                  ].map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={getMonacoLang(activeLang)}
                theme="vs-dark"
                value={formData.codeStubs?.[activeLang] || ""}
                onChange={(v) =>
                  patch({ codeStubs: { ...formData.codeStubs, [activeLang]: v || "" } })
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 24,
                  padding: { top: 20 },
                  fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
