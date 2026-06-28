"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { applicationDetailManager } from "@/services/application-detail.manager";
import Editor from "@monaco-editor/react";
import { BookOpen, CheckCircle2, Clock, Code2, FileCode2, Send, Terminal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { components } from "../../../schema-from-be";

type CodingProblemSnapshot = components["schemas"]["CodingProblemSnapshot"];
type CompileRequest = components["schemas"]["CompileRequest"];

const LANGUAGES = [
  { value: "JAVA", label: "Java", monaco: "java" },
  { value: "PYTHON", label: "Python 3", monaco: "python" },
  { value: "JAVASCRIPT", label: "JavaScript", monaco: "javascript" },
  { value: "TYPESCRIPT", label: "TypeScript", monaco: "typescript" },
  { value: "CPP", label: "C++", monaco: "cpp" },
  { value: "CSHARP", label: "C#", monaco: "csharp" },
  { value: "GO", label: "Go", monaco: "go" },
  { value: "RUST", label: "Rust", monaco: "rust" },
  { value: "KOTLIN", label: "Kotlin", monaco: "kotlin" },
];

const DEFAULT_CODE: Record<string, string> = {
  JAVA: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n        \n    }\n}`,
  PYTHON: `# Write your solution here\n`,
  JAVASCRIPT: `// Write your solution here\n`,
  TYPESCRIPT: `// Write your solution here\n`,
  CPP: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  CSHARP: `using System;\n\nclass Solution {\n    static void Main() {\n        // Write your solution here\n    }\n}`,
  GO: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n}`,
  RUST: `fn main() {\n    // Write your solution here\n}`,
  KOTLIN: `fun main() {\n    // Write your solution here\n}`,
};

export interface CodingSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: number;
  roundId: number;
  roundName?: string;
  codingProblems: CodingProblemSnapshot[];
  codingProblemsId?: number[];
  instruction?: string;
  timeLimitMinutes?: number;
  onSuccess?: (message?: string) => void;
}

export function CodingSubmissionModal({
  open: _open,
  onOpenChange,
  applicationId,
  roundName,
  codingProblems,
  codingProblemsId,
  timeLimitMinutes = 60,
  onSuccess,
}: CodingSubmissionModalProps) {
  const { t } = useTranslation();

  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [language, setLanguage] = useState("JAVA");
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [problems, setProblems] = useState<CodingProblemSnapshot[]>(codingProblems);

  // Initialize / fetch problems
  useEffect(() => {
    setProblems(codingProblems);
    if (_open && codingProblems.length > 0) {
      const initialCodes: Record<number, string> = {};
      codingProblems.forEach((p, idx) => {
        const lang = language;
        initialCodes[p.problemId ?? idx] =
          codes[p.problemId ?? idx] || DEFAULT_CODE[lang] || "// Write your solution here\n";
      });
      setCodes(initialCodes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_open]);

  // Fetch problems by IDs if array is empty
  useEffect(() => {
    if (
      _open &&
      (codingProblems.length === 0 || problems.length === 0) &&
      codingProblemsId &&
      codingProblemsId.length > 0
    ) {
      Promise.all(
        codingProblemsId.map((id) =>
          fetch(`https://api.kdz.asia/api/coding-problems/${id}`)
            .then((r) => r.json())
            .catch(() => null)
        )
      ).then((results) => {
        const fetched = results.filter(Boolean) as CodingProblemSnapshot[];
        if (fetched.length > 0) {
          setProblems(fetched);
          const initialCodes: Record<number, string> = {};
          fetched.forEach((p, idx) => {
            const lang = language;
            initialCodes[p.problemId ?? idx] =
              DEFAULT_CODE[lang] || "// Write your solution here\n";
          });
          setCodes(initialCodes);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_open]);

  const activeProblem = problems[activeProblemIdx];
  const activeProblemId = activeProblem?.problemId ?? activeProblemIdx;
  const activeCode = codes[activeProblemId] ?? DEFAULT_CODE[language] ?? "";

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      setCodes((prev) => ({
        ...prev,
        [activeProblemId]: value ?? "",
      }));
    },
    [activeProblemId]
  );

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      const currentCode = codes[activeProblemId];
      const isDefault =
        !currentCode ||
        Object.values(DEFAULT_CODE).some((tpl) => tpl.trim() === currentCode.trim());
      if (isDefault) {
        setCodes((prev) => ({
          ...prev,
          [activeProblemId]: DEFAULT_CODE[lang] ?? "",
        }));
      }
    },
    [codes, activeProblemId]
  );

  const handleSubmit = async () => {
    if (problems.length === 0) {
      toast.warning("Chưa có bài tập nào. Không thể nộp bài.");
      return;
    }

    const emptyProblems = problems.filter((p) => {
      const code = codes[p.problemId ?? problems.indexOf(p)] ?? "";
      return !code.trim() || Object.values(DEFAULT_CODE).some((tpl) => tpl.trim() === code.trim());
    });

    if (emptyProblems.length > 0) {
      toast.warning(
        `Vui lòng nhập code cho tất cả bài. Còn ${emptyProblems.length} bài chưa có nội dung.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const compileRequest: CompileRequest[] = problems.map((p) => {
        const problemId = p.problemId ?? problems.indexOf(p);
        const code = codes[problemId] ?? "";
        const lines = code.split("\n");
        return {
          problemId,
          language: language as CompileRequest["language"],
          sourceCode: lines,
          isTest: false,
        };
      });

      const result = await applicationDetailManager.submit({
        applicationId,
        compileRequest: JSON.stringify(compileRequest),
      });

      if (result.success) {
        onOpenChange(false);
        toast.success(
          result.data?.message ??
            t("common.applicationSubmittedSuccessfully") ??
            "Nộp bài thành công!"
        );
        onSuccess?.(result.data?.message);
      } else {
        toast.error(result.error ?? t("common.anErrorHasOccurred") ?? "Có lỗi xảy ra");
      }
    } catch (e) {
      console.error(e);
      toast.error(t("common.anErrorHasOccurred") ?? "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const lineCount = activeCode.split("\n").length;
  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monaco ?? "java";

  return (
    <Dialog open={_open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col overflow-hidden p-0"
        style={{ width: "95vw", height: "92vh", maxWidth: "95vw", maxHeight: "92vh" }}>
        {/* ── Header ── */}
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-3 text-base">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-sm">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-slate-900 dark:text-white">
                  {roundName ?? "Vòng Lập trình"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {problems.length > 0
                      ? `${problems.length} bài tập · ${LANGUAGES.find((l) => l.value === language)?.label}`
                      : "Chưa có đề bài"}
                  </span>
                </div>
              </div>
            </DialogTitle>

            <div className="flex shrink-0 items-center gap-3">
              {timeLimitMinutes > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 tabular-nums dark:text-amber-300">
                    {timeLimitMinutes} phút
                  </span>
                </div>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="sm"
                className="gap-2 bg-green-600 px-4 font-semibold shadow-sm hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" tone="white" />
                    <span>Đang nộp...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Nộp bài</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* ── IDE workspace ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — problem list */}
          <div
            className={cn(
              "flex shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-100 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900",
              sidebarCollapsed ? "w-12" : "w-72"
            )}>
            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="group flex h-10 shrink-0 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-800/50">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Bài tập
                </span>
              )}
              <div className="ml-auto rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                <svg
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    sidebarCollapsed && "rotate-180"
                  )}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {!sidebarCollapsed && (
              <div className="flex-1 overflow-y-auto py-2">
                {problems.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-8 text-center">
                    <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-xs font-medium text-slate-400">Chưa có đề bài</p>
                    <p className="mt-1 text-[10px] text-slate-400">Admin chưa cấu hình bài tập</p>
                  </div>
                ) : (
                  problems.map((problem, idx) => {
                    const problemId = problem.problemId ?? idx;
                    const code = codes[problemId] ?? "";
                    const hasCode =
                      code.trim() &&
                      !Object.values(DEFAULT_CODE).some((tpl) => tpl.trim() === code.trim());
                    const isActive = activeProblemIdx === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveProblemIdx(idx)}
                        className={cn(
                          "group flex w-full items-start gap-3 px-4 py-3 text-left transition-all",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
                        )}>
                        <div className="mt-0.5 shrink-0">
                          {hasCode ? (
                            <CheckCircle2
                              className={cn(
                                "h-4 w-4",
                                isActive ? "text-green-300" : "text-green-500"
                              )}
                            />
                          ) : (
                            <div
                              className={cn(
                                "h-4 w-4 rounded-full border-2",
                                isActive
                                  ? "border-white/50"
                                  : "border-slate-300 dark:border-slate-600"
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-[10px] font-bold",
                                isActive ? "text-blue-200" : "text-slate-400"
                              )}>
                              #{idx + 1}
                            </span>
                            {problem.difficulty && (
                              <DifficultyPill difficulty={problem.difficulty} active={isActive} />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-snug font-medium">
                            {problem.title ?? `Bài #${idx + 1}`}
                          </p>
                          {(problem.executionTimeLimitMs || problem.memoryLimitMb) && (
                            <div className="mt-1 flex items-center gap-2">
                              {problem.executionTimeLimitMs && (
                                <span
                                  className={cn(
                                    "flex items-center gap-0.5 text-[9px]",
                                    isActive ? "text-blue-200" : "text-slate-400"
                                  )}>
                                  <Clock className="h-2.5 w-2.5" />
                                  {problem.executionTimeLimitMs >= 1000
                                    ? `${problem.executionTimeLimitMs / 1000}s`
                                    : `${problem.executionTimeLimitMs}ms`}
                                </span>
                              )}
                              {problem.memoryLimitMb && (
                                <span
                                  className={cn(
                                    "flex items-center gap-0.5 text-[9px]",
                                    isActive ? "text-blue-200" : "text-slate-400"
                                  )}>
                                  <Terminal className="h-2.5 w-2.5" />
                                  {problem.memoryLimitMb}MB
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Center — Monaco Editor */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Editor toolbar */}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#252526] px-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-orange-400" />
                <span className="font-mono text-xs font-semibold text-slate-300">
                  {activeProblem?.title ?? `submission_${activeProblemIdx + 1}`}
                </span>
                {activeProblem && (
                  <DifficultyPill
                    difficulty={activeProblem.difficulty ?? "MEDIUM"}
                    active={false}
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isSubmitting}
                  className="h-7 rounded border border-white/20 bg-[#3c3c3c] px-2 text-xs font-medium text-slate-200 focus:border-blue-500 focus:outline-none">
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 tabular-nums">{lineCount} lines</span>
              </div>
            </div>

            {/* Monaco */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={monacoLang}
                value={activeCode}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineHeight: 22,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  renderLineHighlight: "line",
                  tabSize: 4,
                  insertSpaces: true,
                  automaticLayout: true,
                  glyphMargin: false,
                  fixedOverflowWidgets: true,
                }}
              />
            </div>
          </div>

          {/* Right panel — problem details */}
          <div className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {activeProblem ? `Đề bài #${activeProblemIdx + 1}` : "Không có đề bài"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeProblem ? (
                <ProblemView problem={activeProblem} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    Không có thông tin đề bài
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Problem View sub-component
// ──────────────────────────────────────────────

function ProblemView({ problem }: { problem: CodingProblemSnapshot }) {
  return (
    <div className="space-y-5">
      {/* Title + difficulty */}
      {problem.title && (
        <div>
          <h3 className="text-sm leading-snug font-bold text-slate-900 dark:text-slate-100">
            {problem.title}
          </h3>
        </div>
      )}

      {/* Constraints badges */}
      <div className="flex flex-wrap gap-1.5">
        {problem.difficulty && <DifficultyPill difficulty={problem.difficulty} active={false} />}
        {problem.executionTimeLimitMs && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="h-3 w-3" />
            {problem.executionTimeLimitMs >= 1000
              ? `${problem.executionTimeLimitMs / 1000}s`
              : `${problem.executionTimeLimitMs}ms`}
          </span>
        )}
        {problem.memoryLimitMb && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Terminal className="h-3 w-3" />
            {problem.memoryLimitMb}MB
          </span>
        )}
      </div>

      {/* Problem statement */}
      {problem.problemStatement && (
        <div>
          <SectionLabel>Mô tả</SectionLabel>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
            {problem.problemStatement}
          </p>
        </div>
      )}

      {/* Rules & Constraints */}
      {problem.rulesAndConstraints && problem.rulesAndConstraints.length > 0 && (
        <div>
          <SectionLabel>Ràng buộc</SectionLabel>
          <ul className="space-y-1.5">
            {problem.rulesAndConstraints.map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                <span className="font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {rule}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Visible Examples */}
      {problem.visibleExamples && problem.visibleExamples.length > 0 && (
        <div>
          <SectionLabel>Ví dụ</SectionLabel>
          <div className="space-y-3">
            {problem.visibleExamples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                {ex.inputs && (
                  <div className="mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">Input: </span>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {Array.isArray(ex.inputs) ? ex.inputs.join(", ") : ex.inputs}
                    </span>
                  </div>
                )}
                {ex.output && (
                  <div className="mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">Output: </span>
                    <span className="font-mono text-xs text-green-600 dark:text-green-400">
                      {ex.output}
                    </span>
                  </div>
                )}
                {ex.explanation && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400">Giải thích: </span>
                    <span className="text-xs text-slate-500 italic dark:text-slate-400">
                      {ex.explanation}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code stubs */}
      {problem.codeStubs && Object.keys(problem.codeStubs).length > 0 && (
        <div>
          <SectionLabel>Code stub</SectionLabel>
          <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 dark:border-slate-700">
            {Object.entries(problem.codeStubs).map(([filename, code]) => (
              <div key={filename} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-mono text-[11px] font-semibold text-indigo-300">
                    {filename}
                  </span>
                </div>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
                  {code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
      {children}
    </h4>
  );
}

function DifficultyPill({ difficulty, active }: { difficulty: string; active: boolean }) {
  const map: Record<string, string> = {
    EASY: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    HARD: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  const activeMap: Record<string, string> = {
    EASY: "bg-green-300/20 text-green-200 ring-1 ring-green-300/30",
    MEDIUM: "bg-amber-300/20 text-amber-200 ring-1 ring-amber-300/30",
    HARD: "bg-red-300/20 text-red-200 ring-1 ring-red-300/30",
  };
  const labels: Record<string, string> = {
    EASY: "Dễ",
    MEDIUM: "TB",
    HARD: "Khó",
  };

  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-bold",
        active ? (activeMap[difficulty] ?? "") : (map[difficulty] ?? "bg-slate-100 text-slate-500")
      )}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}
