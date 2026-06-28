"use client";

import { useRoundConfig } from "@/hooks/useRoundConfig";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  FileCode2,
  Loader2,
  Play,
  Terminal,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { components } from "../../../schema-from-be";

type ApplicationDetail = components["schemas"]["ApplicationDetail"];
type SubmissionData = components["schemas"]["SubmissionData"];
type CodeSubmission = components["schemas"]["CodeSubmission"];
type TestCaseResult = components["schemas"]["TestCaseResult"];
type CodingProblemSnapshot = components["schemas"]["CodingProblemSnapshot"];

const LANGUAGE_MAP: Record<string, string> = {
  JAVA: "java",
  JAVASCRIPT: "javascript",
  JS: "javascript",
  TYPESCRIPT: "typescript",
  TS: "typescript",
  PYTHON: "python",
  "PYTHON 3": "python",
  CPP: "cpp",
  C: "c",
  CSHARP: "csharp",
  GO: "go",
  RUST: "rust",
  KOTLIN: "kotlin",
  SWIFT: "swift",
  RUBY: "ruby",
  PHP: "php",
  DART: "dart",
};

function getMonacoLang(lang: string): string {
  return LANGUAGE_MAP[lang.toUpperCase()] ?? "plaintext";
}

interface CodingRoundGraderProps {
  detail: ApplicationDetail;
}

export function CodingRoundGrader({ detail }: CodingRoundGraderProps) {
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [activeRightTab, setActiveRightTab] = useState<"problem" | "test-results">("problem");

  const applicationId = detail.applicationId;

  // Fetch jdId from applicationId
  const { data: jdId } = useQuery({
    queryKey: ["application", applicationId, "jdId"],
    queryFn: async (): Promise<number | null> => {
      if (!applicationId) return null;
      const { fetchClient } = await import("@/lib/api");
      const result = await fetchClient.GET("/api/applications/{id}", {
        params: { path: { id: applicationId } },
      });
      if (!result.response?.ok) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const app = result.data as any;
      return app?.jdId ?? null;
    },
    enabled: applicationId !== undefined && applicationId > 0,
  });

  // Fetch round config (CODING problems) from JD
  const { data: roundConfig, isLoading: isConfigLoading } = useRoundConfig(jdId ?? 0);

  const submissionData = detail.submissionData as SubmissionData | undefined;
  const codeSubmissions = submissionData?.codeSubmissions ?? [];

  // language: try textContent first (backend may embed language info there), fallback to "java"
  const embeddedLanguage = submissionData?.textContent?.split("\n")[0]?.trim().toUpperCase() ?? "";

  const problems = roundConfig?.codingProblems ?? [];
  const hasSubmissions = codeSubmissions.length > 0;

  const activeSubmission = codeSubmissions[activeProblemIdx] ?? codeSubmissions[0];
  const activeProblem = problems[activeProblemIdx] ?? null;

  const totalPassed = codeSubmissions.reduce(
    (sum, sub) => sum + (sub.testCases?.passedTestCases ?? 0),
    0
  );
  const totalTests = codeSubmissions.reduce(
    (sum, sub) => sum + (sub.testCases?.totalTestCases ?? 0),
    0
  );
  const overallPassRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  const allPassed = totalPassed === totalTests && totalTests > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {/* TOP BAR */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <Code2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {roundConfig?.roundName ?? "Vòng Lập trình"}
            </span>
            {problems.length > 0 && (
              <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                {problems.length} bài
              </span>
            )}
          </div>
        </div>

        {/* Score chips */}
        <div className="flex items-center gap-2">
          {detail.aiScore !== undefined && (
            <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 dark:bg-purple-900/20">
              <Cpu className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                AI: {detail.aiScore}
              </span>
            </div>
          )}
          {detail.hrScore !== undefined && (
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 dark:bg-indigo-900/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                HR: {detail.hrScore}
              </span>
            </div>
          )}
          {hasSubmissions && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1",
                allPassed && "bg-green-50 dark:bg-green-900/20",
                !allPassed && totalPassed > 0 && "bg-amber-50 dark:bg-amber-900/20",
                totalPassed === 0 && totalTests > 0 && "bg-red-50 dark:bg-red-900/20"
              )}>
              <span
                className={cn(
                  "text-xs font-bold",
                  allPassed && "text-green-700 dark:text-green-300",
                  !allPassed && totalPassed > 0 && "text-amber-700 dark:text-amber-300",
                  totalPassed === 0 && totalTests > 0 && "text-red-700 dark:text-red-300"
                )}>
                {totalPassed}/{totalTests}
              </span>
              <span className="text-xs text-slate-500">passed</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Problem list */}
        <div className="flex w-56 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Đề bài & Bài nộp
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {isConfigLoading ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Đang tải đề bài...</span>
              </div>
            ) : problems.length > 0 ? (
              problems.map((problem, idx) => (
                <ProblemSidebarItem
                  key={idx}
                  problem={problem}
                  idx={idx}
                  isActive={activeProblemIdx === idx}
                  submission={codeSubmissions[idx]}
                  onClick={() => setActiveProblemIdx(idx)}
                />
              ))
            ) : hasSubmissions ? (
              codeSubmissions.map((sub, idx) => (
                <SubmissionSidebarItem
                  key={idx}
                  idx={idx}
                  submission={sub}
                  isActive={activeProblemIdx === idx}
                  onClick={() => setActiveProblemIdx(idx)}
                />
              ))
            ) : (
              <div className="px-3 py-8 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-xs text-slate-400">Chưa có đề bài</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Monaco Editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-3.5 w-3.5 text-orange-400" />
              <span className="font-mono text-xs font-semibold text-slate-200">
                {activeProblem?.title ?? `submission_${activeProblemIdx + 1}.java`}
              </span>
              {embeddedLanguage && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  {embeddedLanguage}
                </span>
              )}
            </div>
            {totalTests > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      allPassed && "bg-green-500",
                      !allPassed && totalPassed > 0 && "bg-amber-500",
                      totalPassed === 0 && "bg-red-500"
                    )}
                    style={{ width: `${overallPassRate}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{overallPassRate}%</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeSubmission?.sourceCode ? (
              <Editor
                height="100%"
                language={getMonacoLang(embeddedLanguage || "java")}
                value={activeSubmission.sourceCode.join("\n")}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineHeight: 22,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                  renderLineHighlight: "line",
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  contextmenu: false,
                  links: false,
                  glyphMargin: false,
                  fixedOverflowWidgets: true,
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-slate-950">
                <FileCode2 className="h-12 w-12 text-slate-600" />
                <p className="mt-3 text-sm font-medium text-slate-400">Chưa có bài nộp</p>
                <p className="mt-1 text-xs text-slate-500">Ứng viên chưa nộp bài cho vòng này</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Problem description + Test Results */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
          <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveRightTab("problem")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors",
                activeRightTab === "problem"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}>
              <BookOpen className="h-3.5 w-3.5" />
              Đề bài
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("test-results")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors",
                activeRightTab === "test-results"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}>
              <Terminal className="h-3.5 w-3.5" />
              Kết quả
              {hasSubmissions && (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    allPassed &&
                      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                    !allPassed &&
                      totalPassed > 0 &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                    totalPassed === 0 &&
                      totalTests > 0 &&
                      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  )}>
                  {totalPassed}/{totalTests}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeRightTab === "problem" && (
              <ProblemDescriptionPanel problem={activeProblem} roundConfig={roundConfig ?? null} />
            )}
            {activeRightTab === "test-results" && (
              <TestResultsPanel
                submission={activeSubmission}
                totalPassed={totalPassed}
                totalTests={totalTests}
                roundConfig={roundConfig ?? null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ProblemSidebarItem({
  problem,
  idx,
  isActive,
  submission,
  onClick,
}: {
  problem: CodingProblemSnapshot;
  idx: number;
  isActive: boolean;
  submission?: CodeSubmission;
  onClick: () => void;
}) {
  const passed = submission?.testCases?.passedTestCases ?? 0;
  const total = submission?.testCases?.totalTestCases ?? 0;
  const submitted = submission !== undefined;
  const passRate = total > 0 ? passed / total : 0;

  const diffColors: Record<string, string> = {
    EASY: "text-green-600 dark:text-green-400",
    MEDIUM: "text-amber-600 dark:text-amber-400",
    HARD: "text-red-600 dark:text-red-400",
  };
  const diffBg: Record<string, string> = {
    EASY: "bg-green-50 dark:bg-green-900/20",
    MEDIUM: "bg-amber-50 dark:bg-amber-900/20",
    HARD: "bg-red-50 dark:bg-red-900/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition-all",
        isActive
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/10"
          : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
      )}>
      <div className="mt-0.5 shrink-0">
        {!submitted ? (
          <Clock className="h-4 w-4 text-slate-300 dark:text-slate-600" />
        ) : passRate === 1 ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : passRate > 0 ? (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
          {problem.difficulty && (
            <span
              className={cn(
                "rounded px-1 py-0.5 text-[9px] font-bold",
                diffBg[problem.difficulty] ?? "bg-slate-100 dark:bg-slate-800",
                diffColors[problem.difficulty] ?? "text-slate-500 dark:text-slate-400"
              )}>
              {problem.difficulty}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
          {problem.title ?? `Bài #${idx + 1}`}
        </p>
        {submitted && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {passed}/{total} passed
          </p>
        )}
      </div>

      <ChevronRight
        className={cn(
          "mt-1 h-3 w-3 shrink-0 text-slate-300 transition-transform dark:text-slate-600",
          isActive && "rotate-90 text-blue-400"
        )}
      />
    </button>
  );
}

function SubmissionSidebarItem({
  idx,
  isActive,
  submission,
  onClick,
}: {
  idx: number;
  isActive: boolean;
  submission: CodeSubmission;
  onClick: () => void;
}) {
  const passed = submission.testCases?.passedTestCases ?? 0;
  const total = submission.testCases?.totalTestCases ?? 0;
  const passRate = total > 0 ? passed / total : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition-all",
        isActive
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/10"
          : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
      )}>
      <div className="mt-0.5 shrink-0">
        {passRate === 1 ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : passRate > 0 ? (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        ) : total > 0 ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Play className="h-4 w-4 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
        </div>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
          Bài nộp #{idx + 1}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {passed}/{total} passed
        </p>
      </div>
      <ChevronRight
        className={cn(
          "mt-1 h-3 w-3 shrink-0 text-slate-300 transition-transform dark:text-slate-600",
          isActive && "rotate-90 text-blue-400"
        )}
      />
    </button>
  );
}

function ProblemDescriptionPanel({
  problem,
  roundConfig,
}: {
  problem: CodingProblemSnapshot | null;
  roundConfig: import("@/hooks/useRoundConfig").CodingRoundConfig | null;
}) {
  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">Chưa có thông tin đề bài</p>
        <p className="mt-1 text-xs text-slate-400">Đề bài sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{problem.title}</h3>
          {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {problem.executionTimeLimitMs && (
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {problem.executionTimeLimitMs >= 1000
                ? `${problem.executionTimeLimitMs / 1000}s`
                : `${problem.executionTimeLimitMs}ms`}
            </span>
          </div>
        )}
        {problem.memoryLimitMb && (
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <Terminal className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {problem.memoryLimitMb}MB
            </span>
          </div>
        )}
        {roundConfig && (
          <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 dark:bg-indigo-900/20">
            <Cpu className="h-3 w-3 text-indigo-400" />
            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
              max {roundConfig.maxScore}đ
            </span>
          </div>
        )}
      </div>

      {problem.rulesAndConstraints && problem.rulesAndConstraints.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Ràng buộc
          </h4>
          <ul className="space-y-1">
            {problem.rulesAndConstraints.map((rule, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {problem.problemStatement && (
        <div>
          <h4 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Mô tả
          </h4>
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
            {problem.problemStatement}
          </p>
        </div>
      )}

      {problem.visibleExamples && problem.visibleExamples.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Ví dụ
          </h4>
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

      {problem.codeStubs && Object.keys(problem.codeStubs).length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Code stub
          </h4>
          <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 dark:border-slate-700">
            {Object.entries(problem.codeStubs).map(([filename, code]) => (
              <div key={filename} className="mb-2 last:mb-0">
                <div className="mb-1 flex items-center gap-1.5">
                  <FileCode2 className="h-3 w-3 text-indigo-400" />
                  <span className="font-mono text-[10px] font-semibold text-indigo-300">
                    {filename}
                  </span>
                </div>
                <pre className="overflow-x-auto font-mono text-[10px] leading-relaxed text-slate-300">
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

function TestResultsPanel({
  submission,
  totalPassed,
  totalTests,
  roundConfig,
}: {
  submission?: CodeSubmission;
  totalPassed: number;
  totalTests: number;
  roundConfig: import("@/hooks/useRoundConfig").CodingRoundConfig | null;
}) {
  const testCases = submission?.testCases;
  const results = testCases?.testCases ?? [];
  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  const allPassed = totalPassed === totalTests && totalTests > 0;

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Terminal className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">Chưa có kết quả chấm</p>
        <p className="mt-1 text-xs text-slate-400">Kết quả test sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Tổng kết</span>
          <span
            className={cn(
              "text-sm font-bold",
              allPassed && "text-green-600 dark:text-green-400",
              !allPassed && totalPassed > 0 && "text-amber-600 dark:text-amber-400",
              totalPassed === 0 && totalTests > 0 && "text-red-600 dark:text-red-400"
            )}>
            {totalPassed}/{totalTests} passed
          </span>
        </div>

        <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              allPassed && "bg-green-500",
              !allPassed && totalPassed > 0 && "bg-amber-500",
              totalPassed === 0 && totalTests > 0 && "bg-red-500"
            )}
            style={{ width: `${passRate}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{passRate}% pass rate</span>
          {testCases?.executionTimeMs !== undefined && testCases.executionTimeMs > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {testCases.executionTimeMs}ms
            </span>
          )}
        </div>

        {roundConfig && totalTests > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-xs text-slate-500">Điểm test</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.round((totalPassed / totalTests) * roundConfig.maxScore)} /{" "}
              {roundConfig.maxScore}
            </span>
          </div>
        )}
      </div>

      {results.length > 0 ? (
        <div>
          <h4 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Chi tiết test cases
          </h4>
          <div className="space-y-2">
            {results.map((tc, i) => (
              <TestCaseCard key={i} tc={tc} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs text-slate-400">Chưa có chi tiết test case</p>
        </div>
      )}

      {testCases?.errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
          <div className="mb-1 flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              Lỗi Runtime / Compile
            </span>
          </div>
          <pre className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-red-700 dark:text-red-300">
            {testCases.errorMessage}
          </pre>
        </div>
      )}
    </div>
  );
}

function TestCaseCard({ tc, index }: { tc: TestCaseResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isPassed = tc.status?.toLowerCase() === "passed";
  const hasError = tc.status?.toLowerCase() === "error";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isPassed && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/10",
        !isPassed && !hasError && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/10",
        hasError && "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/10"
      )}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
              isPassed && "bg-green-500 text-white",
              !isPassed && !hasError && "bg-red-500 text-white",
              hasError && "bg-orange-500 text-white"
            )}>
            {index + 1}
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              isPassed && "text-green-700 dark:text-green-300",
              !isPassed && !hasError && "text-red-700 dark:text-red-300",
              hasError && "text-orange-700 dark:text-orange-300"
            )}>
            {tc.status?.toUpperCase() ?? "UNKNOWN"}
          </span>
          {tc.executionTimeMs !== undefined && tc.executionTimeMs > 0 && (
            <span className="text-[10px] text-slate-400">({tc.executionTimeMs}ms)</span>
          )}
        </div>
        <ChevronRight
          className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", expanded && "rotate-90")}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
          {tc.input && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400">Input: </span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                {Array.isArray(tc.input) ? tc.input.join(", ") : tc.input}
              </span>
            </div>
          )}
          <div>
            <span className="text-[10px] font-semibold text-slate-400">Expected: </span>
            <span className="font-mono text-xs text-green-600 dark:text-green-400">
              {tc.expectedOutput ?? "(empty)"}
            </span>
          </div>
          {!isPassed && tc.actualOutput && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400">Got: </span>
              <span className="font-mono text-xs text-red-600 dark:text-red-400">
                {tc.actualOutput}
              </span>
            </div>
          )}
          {tc.errorMessage && (
            <div className="rounded bg-red-100 p-2 font-mono text-[10px] text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {tc.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    EASY: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    HARD: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  const labels: Record<string, string> = {
    EASY: "Dễ",
    MEDIUM: "Trung bình",
    HARD: "Khó",
  };
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold",
        map[difficulty] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      )}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}
