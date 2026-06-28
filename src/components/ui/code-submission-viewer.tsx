import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { CheckCircle2, Clock, Code2, Copy, Cpu } from "lucide-react";
import { useState } from "react";
import type { components } from "../../../schema-from-be";

type CodeSubmission = components["schemas"]["CodeSubmission"];
type TestCaseResult = components["schemas"]["TestCaseResult"];

// Map language names to Monaco editor language IDs
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
  C_SHARP: "csharp",
  GO: "go",
  RUST: "rust",
  KOTLIN: "kotlin",
  SWIFT: "swift",
  RUBY: "ruby",
  PHP: "php",
  SCALA: "scala",
  DART: "dart",
};

function getMonacoLanguage(language: string): string {
  const lang = language.toUpperCase();
  return LANGUAGE_MAP[lang] ?? "plaintext";
}

interface CodeSubmissionViewerProps {
  /** The submitted code (one submission per problem in CODING round) */
  codeSubmission: CodeSubmission;
  /** Language of the submitted code */
  language?: string;
  /** Problem title (optional — from Round config) */
  title?: string;
  /** Problem difficulty (optional — from Round config) */
  difficulty?: string;
  /** Time limit in ms (optional — from Round config) */
  timeLimitMs?: number;
  /** Max score for this problem (optional) */
  maxScore?: number;
  /** AI score for this problem (optional) */
  aiScore?: number;
  /** Whether to start expanded (default true) */
  defaultExpanded?: boolean;
}

export function CodeSubmissionViewer({
  codeSubmission,
  language = "python",
  title,
  difficulty,
  timeLimitMs,
  aiScore,
  defaultExpanded = true,
}: CodeSubmissionViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "test-results">("code");

  const codeLines = codeSubmission.sourceCode ?? [];
  const codeString = codeLines.join("\n");
  const monacoLang = getMonacoLanguage(language);

  const testCases = codeSubmission.testCases;
  const passedTests = testCases?.passedTestCases ?? 0;
  const totalTests = testCases?.totalTestCases ?? 0;
  const testResults = testCases?.testCases ?? [];
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const hasTests = testResults.length > 0;
  const isAllPassed = passedTests === totalTests && totalTests > 0;
  const isAllFailed = passedTests === 0 && totalTests > 0;

  const handleCopy = () => {
    void navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const difficultyColor = (diff?: string) => {
    switch (diff?.toUpperCase()) {
      case "EASY":
        return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "HARD":
        return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title ?? "Bài nộp Code"}
          </span>
          {difficulty && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold",
                difficultyColor(difficulty)
              )}>
              {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
            </span>
          )}
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Score summary */}
          {aiScore !== undefined && (
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-600">
              <Cpu className="h-3.5 w-3.5" />
              AI: {aiScore}
            </div>
          )}

          {/* Test summary */}
          {hasTests && (
            <div
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold",
                isAllPassed &&
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                isAllFailed && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                !isAllPassed &&
                  !isAllFailed &&
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              )}>
              <span>
                {passedTests}/{totalTests} passed
              </span>
              <span className="text-slate-400">({passRate}%)</span>
            </div>
          )}

          <ChevronIcon expanded={isExpanded} />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {/* Tab bar */}
          <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("code");
              }}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-colors",
                activeTab === "code"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}>
              <Code2 className="h-3.5 w-3.5" />
              Code ({codeLines.length} dòng)
            </button>
            {hasTests && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab("test-results");
                }}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-semibold transition-colors",
                  activeTab === "test-results"
                    ? "border-orange-500 text-orange-600 dark:text-orange-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                )}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Test Results ({totalTests})
              </button>
            )}
          </div>

          {/* Code tab */}
          {activeTab === "code" && (
            <div className="relative">
              {/* Copy button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                title="Copy code"
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>

              <Editor
                height="320px"
                language={monacoLang}
                value={codeString}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on",
                  padding: { top: 12, bottom: 12 },
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                  renderLineHighlight: "none",
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  contextmenu: false,
                  links: false,
                }}
              />
            </div>
          )}

          {/* Test results tab */}
          {activeTab === "test-results" && (
            <div className="max-h-80 overflow-y-auto p-4">
              {/* Summary bar */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    <span className="font-bold text-green-600">{passedTests}</span> / {totalTests}{" "}
                    passed
                  </span>
                  <div className="flex h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isAllPassed && "bg-green-500",
                        isAllFailed && "bg-red-500",
                        !isAllPassed && !isAllFailed && "bg-amber-500"
                      )}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {passRate}%
                  </span>
                </div>
                {timeLimitMs && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {timeLimitMs >= 1000 ? `${timeLimitMs / 1000}s` : `${timeLimitMs}ms`} limit
                  </div>
                )}
              </div>

              {/* Individual test cases */}
              <div className="space-y-2">
                {testResults.map((tc, idx) => (
                  <TestCaseRow key={idx} tc={tc} index={idx} />
                ))}
              </div>

              {/* Error message */}
              {testCases?.errorMessage && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Compilation / Runtime Error:
                  </p>
                  <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-red-700 dark:text-red-300">
                    {testCases.errorMessage}
                  </pre>
                </div>
              )}

              {/* Execution time */}
              {testCases?.executionTimeMs !== undefined && testCases.executionTimeMs > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  Total execution time: {testCases.executionTimeMs}ms
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function TestCaseRow({ tc, index }: { tc: TestCaseResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isPassed = tc.status?.toLowerCase() === "passed";
  const hasError = tc.status?.toLowerCase() === "error";
  const inputStr = Array.isArray(tc.input) ? tc.input.join(", ") : (tc.input ?? "");
  const expectedStr = tc.expectedOutput ?? "";
  const actualStr = tc.actualOutput ?? "";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 font-mono text-xs transition-colors",
        isPassed && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20",
        !isPassed && !hasError && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
        hasError && "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20"
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
              "font-semibold",
              isPassed && "text-green-700 dark:text-green-300",
              !isPassed && !hasError && "text-red-700 dark:text-red-300",
              hasError && "text-orange-700 dark:text-orange-300"
            )}>
            {tc.status?.toUpperCase() ?? "UNKNOWN"}
          </span>
          {tc.executionTimeMs !== undefined && tc.executionTimeMs > 0 && (
            <span className="text-slate-400">({tc.executionTimeMs}ms)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tc.input && <span className="text-xs text-slate-500">Input: {inputStr}</span>}
          <ChevronIcon expanded={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          {tc.input && (
            <div>
              <span className="font-bold text-slate-500">Input: </span>
              <span className="text-slate-700 dark:text-slate-300">{inputStr}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-slate-500">Expected: </span>
            <span className="text-green-600 dark:text-green-300">{expectedStr}</span>
          </div>
          {!isPassed && actualStr && (
            <div>
              <span className="font-bold text-slate-500">Got: </span>
              <span className="text-red-600 dark:text-red-300">{actualStr}</span>
            </div>
          )}
          {tc.errorMessage && (
            <div className="rounded bg-red-100 p-2 text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {tc.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
