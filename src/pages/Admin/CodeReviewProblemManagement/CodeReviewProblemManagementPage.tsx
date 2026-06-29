import { PaginationControl } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { formatDate } from "@/lib/formatting";
import { cn, extractDataArray } from "@/lib/utils";
import {
  codeReviewProblemManager,
  type CodeReviewProblem,
} from "@/services/code-review-problem.manager";
import {
  AlertTriangle,
  Bot,
  Bug,
  Eye,
  EyeOff,
  FileCode2,
  Lightbulb,
  Loader2,
  Plus,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import java from "react-syntax-highlighter/dist/cjs/languages/prism/java";
import sql from "react-syntax-highlighter/dist/cjs/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "sonner";
import { CodeReviewProblemBuilder } from "./components/CodeReviewProblemBuilder";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("sql", sql);

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "detail"; problemId: number };

type SortableProblem = CodeReviewProblem & {
  idSortValue: number;
  titleSortValue: string;
  difficultySortValue: string;
  createdAtSortValue: number;
};

export function CodeReviewProblemManagementPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [problems, setProblems] = useState<CodeReviewProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedProblem, setSelectedProblem] = useState<CodeReviewProblem | null>(null);
  const [viewActiveFileIdx, setViewActiveFileIdx] = useState<number>(0);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedProblem) {
      setViewActiveFileIdx(0);
      setExpandedIssues({});
    }
  }, [selectedProblem]);

  const loadProblems = useCallback(
    async (showReloading = false) => {
      if (!showReloading) {
        setIsLoading(true);
      }
      try {
        const response = await codeReviewProblemManager.getAll();
        if (response.success && response.data) {
          const data = extractDataArray<CodeReviewProblem>(response);
          setProblems(data);
        } else {
          toast.error(response.error || t("common.unableToLoadArticleList"));
        }
      } catch {
        toast.error(t("common.unableToLoadArticleList"));
      } finally {
        if (!showReloading) {
          setIsLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      if (difficultyFilter !== "all" && problem.difficulty !== difficultyFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          problem.title?.toLowerCase().includes(q) ||
          problem.language?.toLowerCase().includes(q) ||
          String(problem.id).includes(q)
        );
      }
      return true;
    });
  }, [problems, searchQuery, difficultyFilter]);

  const sortableProblems = useMemo<SortableProblem[]>(() => {
    return filteredProblems.map((problem) => ({
      ...problem,
      idSortValue: typeof problem.id === "number" ? problem.id : 0,
      titleSortValue: problem.title?.toLowerCase() || "",
      difficultySortValue: problem.difficulty || "",
      createdAtSortValue: problem.createdAt ? new Date(problem.createdAt).getTime() : 0,
    }));
  }, [filteredProblems]);

  const { sortedData } = useSortable(sortableProblems, {
    defaultSort: { key: "createdAtSortValue", direction: "desc" },
    noSortBehavior: "preserve",
    tieBreaker: { key: "idSortValue", direction: "desc" },
  });

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_codereviewproblemmanagement_page_pagesize",
    defaultPageSize: 10,
  });

  const pagination = usePagination({ totalCount: sortedData.length, pageSize });
  const pageItems = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
      case "EASY":
        return {
          label: t("common.easy"),
          className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        };
      case "MEDIUM":
        return {
          label: t("common.medium"),
          className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        };
      case "HARD":
        return {
          label: t("common.hard"),
          className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
      default:
        return {
          label: difficulty || "-",
          className: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
        };
    }
  };

  const handleViewDetail = (problem: CodeReviewProblem) => {
    setSelectedProblem(problem);
  };

  const handleBack = () => {
    setView({ mode: "list" });
  };

  if (view.mode === "create") {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="z-10 shrink-0 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                <Bot className="h-5 w-5 text-indigo-500" />
                {t("adminCodeReviewProblem.pageTitle") || t("adminCodeReviewProblem.pageTitle")}
              </h1>
            </div>
            {/* The CodeReviewProblemBuilder has its own Cancel button, but we can add a Back button here if needed.
                Since user asked to just keep it like the management page, we leave the title as is. */}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <CodeReviewProblemBuilder
            onSuccess={() => {
              handleBack();
              void loadProblems(true);
            }}
            onCancel={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header & Toolbar */}
      <div className="z-10 shrink-0 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              <Bot className="h-5 w-5 text-indigo-500" />
              {t("adminCodeReviewProblem.pageTitle") || t("adminCodeReviewProblem.pageTitle")}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Pane: List */}
        <div className="flex w-[400px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            {/* The toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={
                    t("adminCodeReviewProblem.searchPlaceholder") ||
                    t("adminCodeReviewProblem.searchPlaceholder")
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    pagination.goToFirstPage();
                  }}
                  className="h-9 w-full border-slate-200 bg-slate-100/50 text-xs focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/50"
                />
              </div>
              <Select
                value={difficultyFilter}
                onValueChange={(value) => {
                  setDifficultyFilter(value);
                  pagination.goToFirstPage();
                }}>
                <SelectTrigger className="h-9 w-24 shrink-0 border-slate-200 bg-slate-100/50 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                  <SelectValue placeholder={t("common.difficulty")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="EASY">{t("common.difficultyEasy")}</SelectItem>
                  <SelectItem value="MEDIUM">{t("common.difficultyMedium")}</SelectItem>
                  <SelectItem value="HARD">{t("common.difficultyHard")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="h-9 w-9 shrink-0 bg-indigo-600 p-0 text-white shadow-sm hover:bg-indigo-700"
                onClick={() => setView({ mode: "create" })}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>
                  {filteredProblems.length} {t("common.exercises", t("common.exercises"))}
                </span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <SpinnerBlock size="sm" />
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <AlertTriangle className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  {t("adminDashboardoverview.noDataAvailable")}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {/*Thử thay đổi bộ lọc hoặc tạo*/} {t("common.exercises")} {/*mới.*/}
                </p>
              </div>
            ) : (
              pageItems.map((problem) => {
                const difficultyBadge = getDifficultyBadge(problem.difficulty);
                const isSelected = selectedProblem?.id === problem.id;

                return (
                  <div
                    key={problem.id}
                    onClick={() => handleViewDetail(problem)}
                    className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-indigo-500/50 bg-white shadow-md ring-1 ring-indigo-500/20 dark:border-indigo-400/50 dark:bg-slate-800"
                        : "border-slate-200 bg-white/60 hover:border-indigo-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                    }`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4
                        className={`line-clamp-2 text-sm font-semibold ${isSelected ? "text-indigo-700 dark:text-indigo-400" : "text-slate-900 dark:text-slate-100"}`}>
                        {problem.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] ${difficultyBadge.className} ${isSelected ? "border-current bg-transparent" : "bg-transparent"}`}>
                        {difficultyBadge.label}
                      </Badge>
                    </div>

                    <p className="mb-3 line-clamp-2 h-8 text-xs text-slate-500 dark:text-slate-400">
                      {problem.problemStatement || t("general.noDescription")}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100/80 px-1.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {problem.language || "N/A"}
                        </span>
                        <span>#{problem.id}</span>
                      </div>
                      <span className="tabular-nums">
                        {problem.createdAt ? formatDate(problem.createdAt) : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <PaginationControl
              pagination={pagination}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                pagination.goToFirstPage();
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        </div>

        {/* Right Pane: Detail View */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">
          {selectedProblem ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Header Section */}
              <div className="flex flex-none items-center justify-between border-b border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedProblem.title}
                </h2>

                {selectedProblem.problemStatement && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20">
                        <Lightbulb className="h-4 w-4" />
                        {/*Mô tả*/} {t("common.exercises")}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                          <Lightbulb className="h-5 w-5 text-amber-500" />
                          Mô tả {t("common.exercises")}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="prose prose-sm dark:prose-invert mt-4 max-w-none font-sans whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {selectedProblem.problemStatement}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* IDE-like File Viewer Section */}
              {selectedProblem.files && selectedProblem.files.length > 0 && (
                <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                  {/* File Tabs */}
                  <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                    {(selectedProblem.files || []).map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => setViewActiveFileIdx(fIdx)}
                        className={cn(
                          "flex items-center gap-2 border-r border-slate-200 px-4 py-2.5 text-xs font-semibold transition-all dark:border-slate-800",
                          viewActiveFileIdx === fIdx
                            ? "border-b-2 border-b-indigo-500 bg-white text-indigo-600 dark:bg-slate-950 dark:text-indigo-400"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        )}>
                        <FileCode2
                          className={cn(
                            "h-3.5 w-3.5",
                            viewActiveFileIdx === fIdx ? "text-indigo-500" : ""
                          )}
                        />
                        {f.filename || "Untitled"}
                      </button>
                    ))}
                  </div>

                  {/* Code Workspace view with annotations */}
                  <div className="flex-1 overflow-y-auto bg-slate-50 p-4 leading-relaxed select-text dark:bg-slate-950/50">
                    {(() => {
                      const file = (selectedProblem.files || [])[viewActiveFileIdx];
                      if (!file)
                        return (
                          <div className="p-4 text-slate-500 italic">
                            {t("adminCodeReviewProblem.emptyFile")}
                          </div>
                        );

                      return (
                        <SyntaxHighlighter
                          language={file.language ? file.language.toLowerCase() : "typescript"}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: 0, background: "transparent" }}
                          wrapLines={true}
                          renderer={({ rows, stylesheet, useInlineStyles }) => {
                            const renderAst = (node: unknown, i: number): React.ReactNode => {
                              const n = node as Record<string, unknown>;
                              if (n.type === "text") return n.value as string;
                              if (n.type === "element") {
                                const props: Record<string, unknown> = { key: i };
                                if (n.properties) {
                                  const p = n.properties as Record<string, unknown>;
                                  if (p.className) {
                                    const classes = p.className as string[];
                                    props.className = classes.join(" ");
                                    if (useInlineStyles && stylesheet) {
                                      props.style = classes.reduce((acc, cls) => {
                                        return { ...acc, ...(stylesheet[cls] || {}) };
                                      }, {});
                                    }
                                  }
                                  if (p.style) {
                                    props.style = {
                                      ...((props.style as object) || {}),
                                      ...(p.style as object),
                                    };
                                  }
                                }
                                return React.createElement(
                                  n.tagName as string,
                                  props,
                                  n.children
                                    ? (n.children as unknown[]).map((child: unknown, idx: number) =>
                                        renderAst(child, idx)
                                      )
                                    : null
                                );
                              }
                              return null;
                            };

                            return (
                              <div className="w-full">
                                {rows.map((row, lineIdx) => {
                                  const currentLineNum = lineIdx + 1;
                                  const lineIssues = (selectedProblem.expectedIssues || []).filter(
                                    (iss) =>
                                      iss.filename === file.filename &&
                                      Number(iss.lineNumber) === currentLineNum
                                  );

                                  const toggleKey = `view-${file.filename}-${currentLineNum}`;
                                  const isExpanded = !!expandedIssues[toggleKey];

                                  return (
                                    <React.Fragment key={lineIdx}>
                                      <div
                                        className={cn(
                                          "group relative flex items-center rounded-sm px-1 py-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/40",
                                          lineIssues.length > 0 &&
                                            "border-l-2 border-l-red-500 bg-red-50 dark:bg-red-950/10"
                                        )}>
                                        {/* Gutter Gutter on the LEFT side */}
                                        <div className="flex w-20 shrink-0 items-center justify-end gap-1.5 pr-2.5 select-none">
                                          {lineIssues.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setExpandedIssues((prev) => ({
                                                  ...prev,
                                                  [toggleKey]: !prev[toggleKey],
                                                }));
                                              }}
                                              className={cn(
                                                "flex items-center justify-center rounded-full transition-colors",
                                                isExpanded
                                                  ? "text-red-600 hover:text-red-700 dark:text-red-400"
                                                  : "text-red-400 hover:text-red-600 dark:text-red-500"
                                              )}>
                                              {isExpanded ? (
                                                <Eye className="h-4 w-4" />
                                              ) : (
                                                <EyeOff className="h-4 w-4" />
                                              )}
                                            </button>
                                          )}
                                          <span className="w-6 text-right font-semibold text-slate-400 dark:text-slate-600">
                                            {currentLineNum}
                                          </span>
                                        </div>

                                        {/* Code Line Content */}
                                        <div className="ml-4 flex-1 font-mono break-all whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                                          {row.children
                                            ? row.children.map((child, idx) =>
                                                renderAst(child, idx)
                                              )
                                            : null}
                                        </div>
                                      </div>

                                      {/* Expanded Issue Detail */}
                                      {isExpanded && lineIssues.length > 0 && (
                                        <div className="animate-in fade-in slide-in-from-top-1 my-1.5 mr-2 ml-20 flex">
                                          <div className="relative w-full rounded-md border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/50 dark:bg-slate-900">
                                            <div className="absolute top-3 -left-2 h-0 w-0 border-y-[6px] border-r-[8px] border-y-transparent border-r-red-200 dark:border-r-red-900/50"></div>
                                            <div className="absolute top-[13px] -left-[7px] h-0 w-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-white dark:border-r-slate-900"></div>

                                            <div className="flex flex-col gap-3">
                                              {lineIssues.map((iss, iIdx) => (
                                                <div key={iIdx} className="flex gap-2">
                                                  <Bug className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                                  <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                        {t("common.error")} {/*dòng*/}{" "}
                                                        {iss.lineNumber}
                                                      </span>
                                                      <Badge
                                                        variant="outline"
                                                        className={cn(
                                                          "h-5 border-transparent px-1.5 text-[10px] uppercase",
                                                          (iss.severity as string) === "CRITICAL" &&
                                                            "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                                                          (iss.severity as string) === "HIGH" &&
                                                            "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
                                                          (iss.severity as string) === "MEDIUM" &&
                                                            "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
                                                          (iss.severity as string) === "LOW" &&
                                                            "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
                                                          (iss.severity as string) === "INFO" &&
                                                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        )}>
                                                        {iss.severity}
                                                      </Badge>
                                                    </div>
                                                    <p className="font-sans text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                                                      {iss.description}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            );
                          }}>
                          {(file.content || "").replace(/\\n/g, "\n")}
                        </SyntaxHighlighter>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <Bot className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {/*Chưa chọn*/} {t("common.exercises")}
              </h3>
              <p className="max-w-sm text-slate-500 dark:text-slate-400">
                {/*Chọn một*/} {t("common.exercises")} từ danh sách bên trái để xem chi tiết thông
                tin, mã nguồn và các lỗi cần tìm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
