/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
import { PaginationControl, ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SpinnerBlock } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { formatDate } from "@/lib/formatting";
import { extractDataArray } from "@/lib/utils";
import {
  codeReviewProblemManager,
  type CodeFile,
  type CodeReviewProblem,
  type ExpectedIssue,
} from "@/services/code-review-problem.manager";
import { AlertTriangle, Bot, ChevronRight, Eye, Lightbulb, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedProblem, setSelectedProblem] = useState<CodeReviewProblem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadProblems = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsReloading(true);
      } else {
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
        if (showReloading) {
          setIsReloading(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const sortableProblems = useMemo<SortableProblem[]>(() => {
    return problems.map((problem) => ({
      ...problem,
      idSortValue: typeof problem.id === "number" ? problem.id : 0,
      titleSortValue: problem.title?.toLowerCase() || "",
      difficultySortValue: problem.difficulty || "",
      createdAtSortValue: problem.createdAt ? new Date(problem.createdAt).getTime() : 0,
    }));
  }, [problems]);

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
    setIsDetailOpen(true);
  };

  const handleBack = () => {
    setView({ mode: "list" });
  };

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTargetLevel, setAiTargetLevel] = useState("");
  const [aiProgrammingLanguage, setAiProgrammingLanguage] = useState("");
  const [aiContextJobTitle, setAiContextJobTitle] = useState("");
  const [aiContextRequirement, setAiContextRequirement] = useState("");
  const [aiContextPrompting, setAiContextPrompting] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = useCallback(async () => {
    if (!aiTopic.trim() || !aiTargetLevel.trim() || !aiProgrammingLanguage.trim()) {
      toast.error(t("adminCodeReviewProblem.requiredFields"));
      return;
    }
    setGenerating(true);
    try {
      const response = await codeReviewProblemManager.generate({
        topic: aiTopic.trim(),
        targetLevel: aiTargetLevel.trim(),
        programmingLanguage: aiProgrammingLanguage.trim(),
        context: {
          jobTitle: aiContextJobTitle.trim() || undefined,
          requirement: aiContextRequirement.trim() || undefined,
          prompting: aiContextPrompting.trim() || undefined,
        },
      });
      if (response.success && response.data) {
        const data = response.data as Partial<CodeReviewProblem>;
        if (data.title) setGeneratedTitle(data.title);
        if (data.problemStatement) setGeneratedProblemStatement(data.problemStatement);
        if (data.language) setGeneratedLanguage(data.language);
        if (data.difficulty) setGeneratedDifficulty(data.difficulty as "EASY" | "MEDIUM" | "HARD");
        if (data.files) setGeneratedFiles(data.files);
        if (data.expectedIssues) setGeneratedIssues(data.expectedIssues);
        setAiDialogOpen(false);
        toast.success(t("adminCodeReviewProblem.generatedSuccessfully"));
      } else {
        toast.error(response.error || t("adminCodeReviewProblem.generateFailed"));
      }
    } catch {
      toast.error(t("adminCodeReviewProblem.generateFailed"));
    } finally {
      setGenerating(false);
    }
  }, [
    aiTopic,
    aiTargetLevel,
    aiProgrammingLanguage,
    aiContextJobTitle,
    aiContextRequirement,
    aiContextPrompting,
    t,
  ]);

  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedDifficulty, setGeneratedDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM"
  );
  const [generatedLanguage, setGeneratedLanguage] = useState("");
  const [generatedProblemStatement, setGeneratedProblemStatement] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<CodeFile[]>([]);
  const [generatedIssues, setGeneratedIssues] = useState<ExpectedIssue[]>([]);

  const resetGenerated = useCallback(() => {
    setGeneratedTitle("");
    setGeneratedDifficulty("MEDIUM");
    setGeneratedLanguage("");
    setGeneratedProblemStatement("");
    setGeneratedFiles([]);
    setGeneratedIssues([]);
  }, []);

  if (view.mode === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50">
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                  <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                  {t("common.backToTheList")}
                </Button>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                    {t("adminCodeReviewProblem.pageTitle")}
                  </span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {t("common.create")}
                  </span>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {t("common.create")} {t("adminCodeReviewProblem.pageTitle")}
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t("adminCodeReviewProblem.createDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg dark:bg-slate-900">
                <CardContent className="p-6">
                  <CodeReviewProblemForm
                    onSuccess={() => {
                      handleBack();
                      void loadProblems(true);
                    }}
                    onCancel={handleBack}
                    aiDialogOpen={aiDialogOpen}
                    onAiDialogOpenChange={setAiDialogOpen}
                    aiTopic={aiTopic}
                    onAiTopicChange={setAiTopic}
                    aiTargetLevel={aiTargetLevel}
                    onAiTargetLevelChange={setAiTargetLevel}
                    aiProgrammingLanguage={aiProgrammingLanguage}
                    onAiProgrammingLanguageChange={setAiProgrammingLanguage}
                    aiContextJobTitle={aiContextJobTitle}
                    onAiContextJobTitleChange={setAiContextJobTitle}
                    aiContextRequirement={aiContextRequirement}
                    onAiContextRequirementChange={setAiContextRequirement}
                    aiContextPrompting={aiContextPrompting}
                    onAiContextPromptingChange={setAiContextPrompting}
                    generating={generating}
                    onGenerateAI={handleGenerateAI}
                    generatedTitle={generatedTitle}
                    onGeneratedTitleChange={setGeneratedTitle}
                    generatedDifficulty={generatedDifficulty}
                    onGeneratedDifficultyChange={setGeneratedDifficulty}
                    generatedLanguage={generatedLanguage}
                    onGeneratedLanguageChange={setGeneratedLanguage}
                    generatedProblemStatement={generatedProblemStatement}
                    onGeneratedProblemStatementChange={setGeneratedProblemStatement}
                    generatedFiles={generatedFiles}
                    onGeneratedFilesChange={setGeneratedFiles}
                    generatedIssues={generatedIssues}
                    onGeneratedIssuesChange={setGeneratedIssues}
                    resetGenerated={resetGenerated}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg dark:from-slate-800 dark:to-slate-700">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {t("adminCodeReviewProblem.tipsTitle")}
                      </h3>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{t("adminCodeReviewProblem.tipClearGoals")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{t("adminCodeReviewProblem.tipProvideCode")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{t("adminCodeReviewProblem.tipListIssues")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{t("adminCodeReviewProblem.tipUseAI")}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg dark:from-emerald-950/50 dark:to-teal-950/50">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {t("adminCodeReviewProblem.aiFeatureTitle")}
                      </h3>
                    </div>
                    <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                      {t("adminCodeReviewProblem.aiFeatureDescription")}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-emerald-200 bg-white hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:hover:bg-emerald-900/30"
                      onClick={() => setAiDialogOpen(true)}>
                      <Bot className="h-4 w-4" />
                      {t("adminCodeReviewProblem.generateAI")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>{t("adminCodeReviewProblem.aiGenerateTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("adminCodeReviewProblem.topic")} *</Label>
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Spring Security..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("adminCodeReviewProblem.difficulty")} *</Label>
                  <Select
                    value={generatedDifficulty}
                    onValueChange={(v) => setGeneratedDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">{t("common.easy")}</SelectItem>
                      <SelectItem value="MEDIUM">{t("common.medium")}</SelectItem>
                      <SelectItem value="HARD">{t("common.hard")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("adminCodeReviewProblem.programmingLanguage")} *</Label>
                  <Input
                    value={aiProgrammingLanguage}
                    onChange={(e) => setAiProgrammingLanguage(e.target.value)}
                    placeholder="Java"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("adminCodeReviewProblem.targetLevel")} *</Label>
                <Input
                  value={aiTargetLevel}
                  onChange={(e) => setAiTargetLevel(e.target.value)}
                  placeholder="Junior, Senior..."
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminCodeReviewProblem.contextJobTitle")}</Label>
                <Input
                  value={aiContextJobTitle}
                  onChange={(e) => setAiContextJobTitle(e.target.value)}
                  placeholder="Backend Developer"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminCodeReviewProblem.contextRequirement")}</Label>
                <Textarea
                  value={aiContextRequirement}
                  onChange={(e) => setAiContextRequirement(e.target.value)}
                  placeholder={t("adminCodeReviewProblem.contextRequirement")}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminCodeReviewProblem.contextPrompting")}</Label>
                <Textarea
                  value={aiContextPrompting}
                  onChange={(e) => setAiContextPrompting(e.target.value)}
                  placeholder={t("adminCodeReviewProblem.contextPrompting")}
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleGenerateAI} disabled={generating} className="flex-1">
                  {generating ? (
                    <>
                      <SpinnerBlock size="sm" />
                      {t("adminCodeReviewProblem.generating")}
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      {t("adminCodeReviewProblem.generate")}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                  {t("general.cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-slate-100">
            {t("adminCodeReviewProblem.pageTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("adminCodeReviewProblem.pageDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={() => loadProblems(true)}
            isLoading={isReloading}
            tooltip={t("common.reload")}
          />
          <Button
            onClick={() =>
              setView({
                mode: "create",
              })
            }>
            <Plus className="mr-1 h-4 w-4" />
            {t("common.create")}
          </Button>
        </div>
      </div>

      <Card className="dark:bg-slate-900">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Input
                placeholder={t("adminCodeReviewProblem.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pagination.goToFirstPage();
                }}
              />
            </div>
            <Select
              value={difficultyFilter}
              onValueChange={(value) => {
                setDifficultyFilter(value);
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("adminCodeReviewProblem.difficulty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatus")}</SelectItem>
                <SelectItem value="EASY">{t("common.easy")}</SelectItem>
                <SelectItem value="MEDIUM">{t("common.medium")}</SelectItem>
                <SelectItem value="HARD">{t("common.hard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <SpinnerBlock size="lg" />
          ) : filteredProblems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              {t("common.noDataAvailable")}
            </div>
          ) : (
            <div className="rounded-md border dark:border-slate-800">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("common.title1")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("adminCodeReviewProblem.language")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("adminCodeReviewProblem.difficulty")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("common.creationDate")}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t("common.operation")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((problem) => {
                    const difficultyBadge = getDifficultyBadge(problem.difficulty);
                    return (
                      <tr key={problem.id} className="border-b last:border-0 dark:border-slate-800">
                        <td className="px-4 py-3 text-sm dark:text-slate-300">#{problem.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium dark:text-slate-100">{problem.title}</p>
                          {problem.problemStatement && (
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {problem.problemStatement}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm dark:text-slate-300">
                          {problem.language || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={difficultyBadge.className}>
                            {difficultyBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm dark:text-slate-300">
                          {problem.createdAt ? formatDate(problem.createdAt) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(problem)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <PaginationControl
            pagination={pagination}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              pagination.goToFirstPage();
            }}
            pageSizeOptions={[6, 9, 10, 20]}
          />
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">{selectedProblem?.title}</DialogTitle>
          </DialogHeader>
          {selectedProblem && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getDifficultyBadge(selectedProblem.difficulty).className}>
                  {getDifficultyBadge(selectedProblem.difficulty).label}
                </Badge>
                {selectedProblem.language && (
                  <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">
                    {selectedProblem.language}
                  </Badge>
                )}
              </div>
              {selectedProblem.problemStatement && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold dark:text-slate-200">
                    {t("adminCodeReviewProblem.problemStatement")}
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-4 text-sm whitespace-pre-wrap dark:bg-slate-800 dark:text-slate-200">
                    {selectedProblem.problemStatement}
                  </div>
                </div>
              )}
              {selectedProblem.files && selectedProblem.files.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold dark:text-slate-200">
                    {t("adminCodeReviewProblem.files")}
                  </h3>
                  <div className="space-y-2">
                    {selectedProblem.files.map((file: CodeFile, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3 dark:border-slate-700">
                        <p className="text-sm font-medium dark:text-slate-200">
                          {file.filename || `File ${idx + 1}`}
                        </p>
                        {file.language && (
                          <Badge
                            variant="outline"
                            className="mt-1 dark:border-slate-600 dark:text-slate-400">
                            {file.language}
                          </Badge>
                        )}
                        {file.content && (
                          <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100 dark:bg-slate-950">
                            {file.content}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedProblem.expectedIssues && selectedProblem.expectedIssues.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold dark:text-slate-200">
                    {t("adminCodeReviewProblem.expectedIssues")}
                  </h3>
                  <div className="space-y-2">
                    {selectedProblem.expectedIssues.map((issue: ExpectedIssue, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg border p-3 dark:border-slate-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div>
                          <p className="text-sm dark:text-slate-200">
                            {issue.filename && (
                              <span className="font-medium">{issue.filename}</span>
                            )}
                            {issue.lineNumber && (
                              <span className="text-slate-500">:{issue.lineNumber}</span>
                            )}
                          </p>
                          {issue.description && (
                            <p className="text-muted-foreground text-xs">{issue.description}</p>
                          )}
                          {issue.severity && (
                            <Badge
                              variant="outline"
                              className="mt-1 dark:border-slate-600 dark:text-slate-400">
                              {issue.severity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-muted-foreground text-xs">
                {selectedProblem.createdAt && (
                  <span>
                    {t("common.creationDate")}: {formatDate(selectedProblem.createdAt)}
                  </span>
                )}
                {selectedProblem.updatedAt && (
                  <span className="ml-4">
                    {t("adminCodeReviewProblem.updatedAt")}: {formatDate(selectedProblem.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CodeReviewProblemForm({
  onSuccess,
  onCancel,
  aiDialogOpen: _aiDialogOpen,
  onAiDialogOpenChange: _onAiDialogOpenChange,
  aiTopic: _aiTopic,
  onAiTopicChange: _onAiTopicChange,
  aiTargetLevel: _aiTargetLevel,
  onAiTargetLevelChange: _onAiTargetLevelChange,
  aiProgrammingLanguage: _aiProgrammingLanguage,
  onAiProgrammingLanguageChange: _onAiProgrammingLanguageChange,
  aiContextJobTitle: _aiContextJobTitle,
  onAiContextJobTitleChange: _onAiContextJobTitleChange,
  aiContextRequirement: _aiContextRequirement,
  onAiContextRequirementChange: _onAiContextRequirementChange,
  aiContextPrompting: _aiContextPrompting,
  onAiContextPromptingChange: _onAiContextPromptingChange,
  generating: _generating,
  onGenerateAI: _onGenerateAI,
  generatedTitle: _generatedTitle,
  onGeneratedTitleChange: _onGeneratedTitleChange,
  generatedDifficulty: _generatedDifficulty,
  onGeneratedDifficultyChange: _onGeneratedDifficultyChange,
  generatedLanguage: _generatedLanguage,
  onGeneratedLanguageChange: _onGeneratedLanguageChange,
  generatedProblemStatement: _generatedProblemStatement,
  onGeneratedProblemStatementChange: _onGeneratedProblemStatementChange,
  generatedFiles: _generatedFiles,
  onGeneratedFilesChange: _onGeneratedFilesChange,
  generatedIssues: _generatedIssues,
  onGeneratedIssuesChange: _onGeneratedIssuesChange,
  resetGenerated: _resetGenerated,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  aiDialogOpen: boolean;
  onAiDialogOpenChange: (open: boolean) => void;
  aiTopic: string;
  onAiTopicChange: (value: string) => void;
  aiTargetLevel: string;
  onAiTargetLevelChange: (value: string) => void;
  aiProgrammingLanguage: string;
  onAiProgrammingLanguageChange: (value: string) => void;
  aiContextJobTitle: string;
  onAiContextJobTitleChange: (value: string) => void;
  aiContextRequirement: string;
  onAiContextRequirementChange: (value: string) => void;
  aiContextPrompting: string;
  onAiContextPromptingChange: (value: string) => void;
  generating: boolean;
  onGenerateAI: () => void;
  generatedTitle: string;
  onGeneratedTitleChange: (value: string) => void;
  generatedDifficulty: "EASY" | "MEDIUM" | "HARD";
  onGeneratedDifficultyChange: (value: "EASY" | "MEDIUM" | "HARD") => void;
  generatedLanguage: string;
  onGeneratedLanguageChange: (value: string) => void;
  generatedProblemStatement: string;
  onGeneratedProblemStatementChange: (value: string) => void;
  generatedFiles: CodeFile[];
  onGeneratedFilesChange: (value: CodeFile[]) => void;
  generatedIssues: ExpectedIssue[];
  onGeneratedIssuesChange: (value: ExpectedIssue[]) => void;
  resetGenerated: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [language, setLanguage] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [expectedIssues, setExpectedIssues] = useState<ExpectedIssue[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddFile = () => {
    setFiles((prev) => [...prev, { filename: "", content: "", language: "" }]);
  };

  const handleUpdateFile = (index: number, field: keyof CodeFile, value: string) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddIssue = () => {
    setExpectedIssues((prev) => [...prev, {}]);
  };

  const handleUpdateIssue = (
    index: number,
    field: keyof ExpectedIssue,
    value: string | number | undefined
  ) => {
    setExpectedIssues((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveIssue = (index: number) => {
    setExpectedIssues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t("adminCodeReviewProblem.titleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<CodeReviewProblem> = {
        title: title.trim(),
        difficulty,
        language: language.trim() || undefined,
        problemStatement: problemStatement.trim() || undefined,
        files: files.length > 0 ? files : undefined,
        expectedIssues: expectedIssues.length > 0 ? expectedIssues : undefined,
      };
      const response = await codeReviewProblemManager.create(payload);
      if (response.success) {
        toast.success(t("common.success"));
        onSuccess();
      } else {
        toast.error(response.error || t("common.unableToSave"));
      }
    } catch {
      toast.error(t("common.unableToSave"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-slate-100">{t("common.create")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => _onAiDialogOpenChange(true)}
          className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <Bot className="h-4 w-4" />
          {t("adminCodeReviewProblem.generateAI")}
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="dark:text-slate-200">{t("common.title1")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("adminCodeReviewProblem.titlePlaceholder")}
          className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="dark:text-slate-200">{t("adminCodeReviewProblem.difficulty")}</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
            <SelectTrigger className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">{t("common.easy")}</SelectItem>
              <SelectItem value="MEDIUM">{t("common.medium")}</SelectItem>
              <SelectItem value="HARD">{t("common.hard")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="dark:text-slate-200">{t("adminCodeReviewProblem.language")}</Label>
          <Input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Java, Python..."
            className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="dark:text-slate-200">
          {t("adminCodeReviewProblem.problemStatement")}
        </Label>
        <Textarea
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          placeholder={t("adminCodeReviewProblem.problemStatementPlaceholder")}
          rows={5}
          className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="dark:text-slate-200">{t("adminCodeReviewProblem.files")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddFile}>
            <Plus className="mr-1 h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border p-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-slate-200">
                  {t("adminCodeReviewProblem.file")} #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(idx)}>
                  <Eye className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <Input
                value={file.filename || ""}
                onChange={(e) => handleUpdateFile(idx, "filename", e.target.value)}
                placeholder={t("adminCodeReviewProblem.filename")}
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <Input
                value={file.language || ""}
                onChange={(e) => handleUpdateFile(idx, "language", e.target.value)}
                placeholder={t("adminCodeReviewProblem.languagePlaceholder")}
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <Textarea
                value={file.content || ""}
                onChange={(e) => handleUpdateFile(idx, "content", e.target.value)}
                placeholder={t("adminCodeReviewProblem.contentPlaceholder")}
                rows={4}
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="dark:text-slate-200">
            {t("adminCodeReviewProblem.expectedIssues")}
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddIssue}>
            <Plus className="mr-1 h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>
        <div className="space-y-2">
          {expectedIssues.map((issue, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border p-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-slate-200">
                  {t("adminCodeReviewProblem.issue")} #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveIssue(idx)}>
                  <Eye className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={issue.filename || ""}
                  onChange={(e) => handleUpdateIssue(idx, "filename", e.target.value)}
                  placeholder={t("adminCodeReviewProblem.filename")}
                  className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Input
                  type="number"
                  value={issue.lineNumber ?? ""}
                  onChange={(e) =>
                    handleUpdateIssue(
                      idx,
                      "lineNumber",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder={t("adminCodeReviewProblem.lineNumber")}
                  className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <Input
                value={issue.severity || ""}
                onChange={(e) => handleUpdateIssue(idx, "severity", e.target.value)}
                placeholder="CRITICAL/WARNING/INFO"
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <Textarea
                value={issue.description || ""}
                onChange={(e) => handleUpdateIssue(idx, "description", e.target.value)}
                placeholder={t("adminCodeReviewProblem.description")}
                rows={2}
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} onClick={handleSubmit}>
          {submitting ? t("common.saving") : t("common.saveChanges")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("general.cancel")}
        </Button>
      </div>
    </div>
  );
}
