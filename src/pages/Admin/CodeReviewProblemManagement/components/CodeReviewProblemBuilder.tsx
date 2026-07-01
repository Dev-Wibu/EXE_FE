import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMonacoTheme } from "@/hooks/useMonacoTheme";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  codeReviewProblemManager,
  type CodeFile,
  type CodeReviewProblem,
  type ExpectedIssue,
} from "@/services/code-review-problem.manager";
import Editor, { useMonaco } from "@monaco-editor/react";
import {
  ChevronDown,
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
const t = (k: string, opts?: string | Record<string, unknown>): string =>
  i18n.t(k, opts as string) as unknown as string;

const plusIconSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
const eyeIconSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%238b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOffIconSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%238b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

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
  initialData,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: CodeReviewProblem | null;
}) {
  const monacoTheme = useMonacoTheme();
  const [creationMode, setCreationMode] = React.useState<"ai" | "manual">("manual");
  const [aiGeneratedLoaded, setAiGeneratedLoaded] = React.useState(true);
  const monaco = useMonaco();

  // Monaco builder states
  const [editorInstance, setEditorInstance] = React.useState<any | null>(null);
  const [expandedIssues, setExpandedIssues] = React.useState<Record<number, boolean>>({});
  const hoveredLineRef = React.useRef<number | null>(null);
  const viewZonesRef = React.useRef<Record<number, string>>({});
  const decorationsRef = React.useRef<string[]>([]);
  const activeFileIdxRef = React.useRef<number>(0);

  // Issue dialog state
  const [issueModalOpen, setIssueModalOpen] = React.useState(false);
  const [issueModalData, setIssueModalData] = React.useState<Partial<ExpectedIssue>>({});
  const [editingIssueIndex, setEditingIssueIndex] = React.useState<number | null>(null);

  const [createActiveFileIdx, setCreateActiveFileIdx] = React.useState<number>(0);

  const [newProblem, setNewProblem] = React.useState<{
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    language: string;
    problemStatement: string;
    files: CodeFile[];
    expectedIssues: ExpectedIssue[];
  }>({
    title: initialData?.title || "",
    difficulty: initialData?.difficulty || "EASY",
    language: initialData?.language || "Java",
    problemStatement: initialData?.problemStatement || "",
    files: initialData?.files?.length
      ? initialData.files
      : [{ filename: "Solution.java", content: "", language: "java" }],
    expectedIssues: initialData?.expectedIssues || [],
  });

  const issuesRef = React.useRef<ExpectedIssue[]>(newProblem.expectedIssues);
  React.useEffect(() => {
    issuesRef.current = newProblem.expectedIssues;
  }, [newProblem.expectedIssues]);

  React.useEffect(() => {
    activeFileIdxRef.current = createActiveFileIdx;
  }, [createActiveFileIdx]);

  // AI states
  const [aiTopic, setAiTopic] = React.useState("");
  const [aiLevel, setAiLevel] = React.useState("Junior");
  const [aiDifficulty, setAiDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [aiLanguage, setAiLanguage] = React.useState("Java");
  const [aiRequirement, setAiRequirement] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!document.getElementById("monaco-builder-styles")) {
      const style = document.createElement("style");
      style.id = "monaco-builder-styles";
      style.innerHTML = `
        .bug-glyph-margin-icon {
          background-image: url('${eyeIconSvg}');
          background-repeat: no-repeat;
          background-position: center;
          background-size: 14px 14px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .bug-glyph-margin-icon:hover {
          opacity: 1;
        }
        .bug-glyph-margin-icon-expanded {
          background-image: url('${eyeOffIconSvg}');
          background-repeat: no-repeat;
          background-position: center;
          background-size: 14px 14px;
          cursor: pointer;
        }
        .bug-add-glyph-icon {
          background-image: url('${plusIconSvg}');
          background-color: #6366f1;
          background-repeat: no-repeat;
          background-position: center;
          background-size: 10px 10px;
          border-radius: 4px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
          margin-top: 2px;
          height: 14px !important;
          width: 14px !important;
          margin-left: 2px;
        }
        .bug-add-glyph-icon:hover {
          background-color: #4f46e5;
          opacity: 1;
        }
        .monaco-issue-zone-container {
          padding: 12px 16px 12px 24px;
          border-top: 1px solid rgba(239, 68, 68, 0.15);
          border-bottom: 1px solid rgba(239, 68, 68, 0.15);
          background-color: rgba(239, 68, 68, 0.08);
          box-shadow: inset 3px 0 0 #ef4444;
          z-index: 10;
        }
        .monaco-issue-zone-container.warning {
          border-top-color: rgba(245, 158, 11, 0.15);
          border-bottom-color: rgba(245, 158, 11, 0.15);
          background-color: rgba(245, 158, 11, 0.08);
          box-shadow: inset 3px 0 0 #f59e0b;
        }
        .monaco-issue-zone-container.info {
          border-top-color: rgba(59, 130, 246, 0.15);
          border-bottom-color: rgba(59, 130, 246, 0.15);
          background-color: rgba(59, 130, 246, 0.08);
          box-shadow: inset 3px 0 0 #3b82f6;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const updateDecorations = React.useCallback(() => {
    if (!editorInstance || !monaco) return;

    const activeFile = newProblem.files[createActiveFileIdx]?.filename || "";
    const fileIssues = issuesRef.current.filter((i) => i.filename === activeFile);

    const newDecorations = fileIssues.map((issue) => {
      const isExpanded = expandedIssues[issue.lineNumber];
      return {
        range: new monaco.Range(issue.lineNumber, 1, issue.lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: isExpanded
            ? "bug-glyph-margin-icon-expanded"
            : "bug-glyph-margin-icon",
          glyphMarginHoverMessage: { value: "Click to view/edit issue" },
        },
      };
    });

    if (hoveredLineRef.current) {
      const hasIssue = fileIssues.some((i) => i.lineNumber === hoveredLineRef.current);
      if (!hasIssue) {
        newDecorations.push({
          range: new monaco.Range(hoveredLineRef.current, 1, hoveredLineRef.current, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: "bug-add-glyph-icon",
            glyphMarginHoverMessage: { value: "Click to add an expected issue here" },
          },
        });
      }
    }

    const decs = editorInstance.deltaDecorations(decorationsRef.current, newDecorations);
    decorationsRef.current = decs;
  }, [editorInstance, monaco, createActiveFileIdx, expandedIssues, newProblem.files]);

  const escapeHtml = (unsafe: string) => {
    if (!unsafe) return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const updateViewZones = React.useCallback(() => {
    if (!editorInstance) return;

    const activeFile = newProblem.files[createActiveFileIdx]?.filename || "";
    const fileIssues = issuesRef.current.filter((i) => i.filename === activeFile);

    editorInstance.changeViewZones((changeAccessor: any) => {
      Object.values(viewZonesRef.current).forEach((id) => {
        changeAccessor.removeZone(id);
      });
      viewZonesRef.current = {};

      fileIssues.forEach((issue) => {
        if (expandedIssues[issue.lineNumber]) {
          const domNode = document.createElement("div");

          let severityClass = "critical";
          let badgeColor = "#ef4444";
          let textColor = "#fca5a5";

          if (issue.severity === "WARNING") {
            severityClass = "warning";
            badgeColor = "#f59e0b";
            textColor = "#fde68a";
          } else if (issue.severity === "INFO") {
            severityClass = "info";
            badgeColor = "#3b82f6";
            textColor = "#bfdbfe";
          }

          domNode.className = `monaco-issue-zone-container ${severityClass}`;

          const issueIndex = issuesRef.current.findIndex(
            (i) => i.filename === activeFile && i.lineNumber === issue.lineNumber
          );

          domNode.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background-color: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">${issue.severity}</span>
                  <span style="font-size: 12px; font-weight: 500; color: #cbd5e1;">Issue on line ${issue.lineNumber}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; padding-right: 16px;">
                   <button id="edit-btn-${issue.lineNumber}" style="font-size: 11px; color: #818cf8; font-weight: 600; cursor: pointer; background: none; border: none; outline: none;">EDIT</button>
                   <button id="del-btn-${issue.lineNumber}" style="font-size: 11px; color: #f87171; font-weight: 600; cursor: pointer; background: none; border: none; outline: none;">DELETE</button>
                </div>
              </div>
              <p style="font-size: 13px; color: ${textColor}; line-height: 1.5; margin: 0; padding-right: 16px; white-space: pre-wrap; word-break: break-word;">${escapeHtml(issue.description)}</p>
            </div>
          `;

          domNode.querySelector(`#edit-btn-${issue.lineNumber}`)?.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            setIssueModalData({ ...issue });
            setEditingIssueIndex(issueIndex);
            setIssueModalOpen(true);
          });

          domNode.querySelector(`#del-btn-${issue.lineNumber}`)?.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            setNewProblem((prev) => ({
              ...prev,
              expectedIssues: prev.expectedIssues.filter((_, i) => i !== issueIndex),
            }));
          });

          const charsPerLine = 90;
          const descLines = Math.ceil(issue.description.length / charsPerLine);
          const headerPx = 36;
          const descPx = descLines * 20;
          const totalPx = headerPx + descPx + 16;
          const editorLineHeight = 19;
          const estimatedLines = Math.max(4, Math.ceil(totalPx / editorLineHeight));

          const zoneId = changeAccessor.addZone({
            afterLineNumber: issue.lineNumber,
            heightInLines: estimatedLines,
            domNode: domNode,
            marginDomNode: null,
          });

          viewZonesRef.current[issue.lineNumber] = zoneId;
        }
      });
    });
  }, [editorInstance, createActiveFileIdx, expandedIssues, newProblem.files]);

  React.useEffect(() => {
    updateDecorations();
    updateViewZones();
  }, [
    expandedIssues,
    newProblem.expectedIssues,
    editorInstance,
    monaco,
    createActiveFileIdx,
    updateDecorations,
    updateViewZones,
  ]);

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    setEditorInstance(editor);

    editor.onMouseMove((e: any) => {
      if (
        e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) {
        const line = e.target.position?.lineNumber;
        if (line && line !== hoveredLineRef.current) {
          hoveredLineRef.current = line;
          updateDecorations();
        }
      } else {
        if (hoveredLineRef.current !== null) {
          hoveredLineRef.current = null;
          updateDecorations();
        }
      }
    });

    editor.onMouseLeave(() => {
      if (hoveredLineRef.current !== null) {
        hoveredLineRef.current = null;
        updateDecorations();
      }
    });

    editor.onMouseDown((e: any) => {
      if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          const activeFile = newProblem.files[activeFileIdxRef.current]?.filename || "";
          const hasIssue = issuesRef.current.some(
            (iss) => iss.filename === activeFile && iss.lineNumber === lineNumber
          );

          if (hasIssue) {
            setExpandedIssues((prev) => ({
              ...prev,
              [lineNumber]: !prev[lineNumber],
            }));
          } else {
            // Open modal to add new issue
            setIssueModalData({
              filename: activeFile,
              lineNumber: lineNumber,
              severity: "CRITICAL",
              description: "",
            });
            setEditingIssueIndex(null);
            setIssueModalOpen(true);
          }
        }
      }
    });
  };

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
      toast.error(t("problem.enterTopicSecurity"));
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
        toast.success(t("problem.codeReviewGenerated"));
      } else {
        toast.error(response.error || t("adminCodeReviewProblem.generateFailed"));
      }
    } catch {
      toast.error(t("adminCodeReviewProblem.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!newProblem.title.trim()) {
      toast.error(t("adminCodeReviewProblem.pleaseEnterTitle"));
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

      let response;
      if (initialData?.id) {
        response = await codeReviewProblemManager.update(initialData.id, payload);
      } else {
        response = await codeReviewProblemManager.create(payload);
      }

      if (response.success) {
        toast.success(
          initialData?.id ? t("adminCodingProblem.updateSuccess") : t("problem.createdSuccessfully")
        );
        onSuccess();
      } else {
        toast.error(response.error || t("adminCodeReviewProblem.cannotSaveProblem"));
      }
    } catch {
      toast.error(t("adminCodeReviewProblem.cannotSaveProblem"));
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
            {t("adminCodeReviewProblem.problemSetup")}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 font-sans text-xs">
            <div>
              <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                {t("adminCodeReviewProblem.problemTitleStar")}
              </Label>
              <Input
                value={newProblem.title}
                onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                placeholder={t("adminCodeReviewProblem.exampleApiTokenLeak")}
                className="mt-1 h-8 border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  {t("adminCodeReviewProblem.programmingLanguage")}
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
                  {t("adminCodeReviewProblem.difficulty")}
                </Label>
                <StyledSelect
                  value={newProblem.difficulty}
                  className="mt-1"
                  onChange={(v) =>
                    setNewProblem({ ...newProblem, difficulty: v as "EASY" | "MEDIUM" | "HARD" })
                  }>
                  <option value="EASY">{t("common.difficultyEasy", t("common.easy"))}</option>
                  <option value="MEDIUM">
                    {t("common.difficultyMedium", t("common.mediumLevel"))}
                  </option>
                  <option value="HARD">{t("common.difficultyHard", t("common.hard"))}</option>
                </StyledSelect>
              </div>
            </div>
            <div>
              <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                {t("adminCodeReviewProblem.requirementContext")}
              </Label>
              <textarea
                value={newProblem.problemStatement}
                onChange={(e) => setNewProblem({ ...newProblem, problemStatement: e.target.value })}
                rows={5}
                placeholder={t("adminCodeReviewProblem.contextPlaceholder")}
                className="mt-1 flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            {t("general.cancel", t("common.cancel"))}
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={submitting || isGenerating}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("adminCodeReviewProblem.saveProblem")}
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
                {t("adminCodeReviewProblem.aiGenerating")}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <Plus className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">
              {t("adminCodeReviewProblem.designNewCodeReview")}
            </h3>
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
                  {t("adminCodeReviewProblem.generateWithAI")}
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
                  {t("adminCodeReviewProblem.manual")}
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
                      {t("adminCodeReviewProblem.designByAi")}
                    </h3>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                      {t("problem.aiGenerateInstruction2")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {/*Chủ đề /*/} {t("common.error")} {/*bảo mật cần review **/}
                    </Label>
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                      placeholder={t("adminCodeReviewProblem.exampleBugTypes")}
                      className="mt-1.5 h-10 border-slate-800 bg-slate-950/60 px-3 text-xs text-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        {t("common.difficulty")}
                      </Label>
                      <StyledSelect
                        value={aiDifficulty}
                        className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                        onChange={(v) => setAiDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                        <option value="EASY">{t("common.easy")}</option>
                        <option value="MEDIUM">{t("common.mediumLevel")}</option>
                        <option value="HARD">{t("common.hard")}</option>
                      </StyledSelect>
                    </div>
                    <div>
                      <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        {t("common.language")}
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
                        {t("adminCodeReviewProblem.candidateLevel")}
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
                      {t("general.additionalRequirements")}
                    </Label>
                    <textarea
                      value={aiRequirement}
                      onChange={(e) => setAiRequirement(e.target.value)}
                      rows={4}
                      placeholder={t("adminCodeReviewProblem.describeProjectContext")}
                      className="border-slate-850 mt-1.5 flex w-full rounded-md border bg-slate-950/60 px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isGenerating || !aiTopic}
                    onClick={handleAiGenerate}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-sans text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Sparkles className="h-4 w-4" />
                    {t("adminCodeReviewProblem.startGeneratingByAi")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/60">
              <div className="flex-1 overflow-y-auto">
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
                              {t("adminCodeReviewProblem.fileName")}
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
                              {t("adminCodeReviewProblem.highlightLanguage")}
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
                        <div className="relative flex-1 rounded-md border border-slate-800 bg-slate-950">
                          <Editor
                            height="100%"
                            language={
                              newProblem.files[createActiveFileIdx].language?.toLowerCase() ||
                              "csharp"
                            }
                            theme={monacoTheme}
                            value={newProblem.files[createActiveFileIdx].content}
                            onMount={handleEditorDidMount}
                            onChange={(val) => {
                              const files = [...newProblem.files];
                              files[createActiveFileIdx].content = val || "";
                              setNewProblem({ ...newProblem, files });
                            }}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 13,
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                              wordWrap: "on",
                              automaticLayout: true,
                              glyphMargin: true,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
