import { Button } from "@/components/ui/button";
import { CodeReviewEditor } from "@/components/ui/code-review-editor";
import { CodingEditor } from "@/components/ui/coding-editor";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuizEditor } from "@/components/ui/quiz-editor";
import { ScoreInput } from "@/components/ui/score-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DetailResponse, SummaryResponse } from "@/interfaces";
import { cn } from "@/lib/utils";
import { interviewTemplateManager } from "@/services/interview-template.manager";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock,
  Code2,
  Edit3,
  Eye,
  FileText,
  HelpCircle,
  LayoutTemplate,
  Mail,
  PlusCircle,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserCheck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Available round types configurations for UI mapping
type RoundType =
  | "CV_SCREENING"
  | "EMAIL_SIMULATOR"
  | "QUIZ"
  | "CODING"
  | "CODE_REVIEW"
  | "MENTROR_REVIEW"
  | "AI_INTERVIEW";

interface UIRoundConfig {
  instruction?: string;
  submissionFormat?: string;
  timeLimitMinutes?: number;
  maxScore?: number;
  aiSystemPrompt?: string;
  evaluationCriteria?: string;
  quizQuestions?: {
    questionText?: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
  }[];
  codingProblemsId?: number[];
  codingProblems?: { problemId?: number; title?: string; difficulty?: string }[];
  codeReviewProblemsId?: number[];
  codeReviewProblems?: {
    problemId?: number;
    title?: string;
    difficulty?: string;
    language?: string;
  }[];
}

interface UIRound {
  id?: number;
  name?: string;
  roundOrder?: number;
  roundType?: RoundType;
  passThreshold?: number;
  configData?: UIRoundConfig;
}

const getAvailableRoundsTemplates = (
  t: (key: string) => string
): {
  type: RoundType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  defaultConfig: UIRoundConfig;
}[] => [
  {
    type: "CV_SCREENING",
    title: t("adminInterviewTemplate.cvScreening.title"),
    description: t("adminInterviewTemplate.cvScreening.description"),
    color: "text-blue-500 border-blue-500/20",
    bgColor: "bg-blue-500/10",
    icon: <FileText className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("cv.uploadPdfOnly"),
      submissionFormat: "pdf",
    },
  },
  {
    type: "EMAIL_SIMULATOR",
    title: t("adminInterviewTemplate.emailSimulator.title"),
    description: t("adminInterviewTemplate.emailSimulator.description"),
    color: "text-purple-500 border-purple-500/20",
    bgColor: "bg-purple-500/10",
    icon: <Mail className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("task.replyComplaintEmail"),
      timeLimitMinutes: 15,
    },
  },
  {
    type: "QUIZ",
    title: t("adminInterviewTemplate.quiz.title"),
    description: t("adminInterviewTemplate.quiz.description"),
    color: "text-amber-500 border-amber-500/20",
    bgColor: "bg-amber-500/10",
    icon: <HelpCircle className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("task.takeTheoryQuiz"),
      timeLimitMinutes: 20,
      quizQuestions: [],
    },
  },
  {
    type: "CODING",
    title: t("adminInterviewTemplate.coding.title"),
    description: t("adminInterviewTemplate.coding.description"),
    color: "text-emerald-500 border-emerald-500/20",
    bgColor: "bg-emerald-500/10",
    icon: <Code2 className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("task.completeCodingExercises"),
      timeLimitMinutes: 45,
      codingProblemsId: [],
    },
  },
  {
    type: "CODE_REVIEW",
    title: t("adminInterviewTemplate.codeReview.title"),
    description: t("adminInterviewTemplate.codeReview.description"),
    color: "text-teal-500 border-teal-500/20",
    bgColor: "bg-teal-500/10",
    icon: <Eye className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("task.reviewSourceCode"),
      timeLimitMinutes: 30,
      codeReviewProblemsId: [],
      codeReviewProblems: [],
    },
  },
  {
    type: "MENTROR_REVIEW",
    title: t("adminInterviewTemplate.mentorReview.title"),
    description: t("adminInterviewTemplate.mentorReview.description"),
    color: "text-rose-500 border-rose-500/20",
    bgColor: "bg-rose-500/10",
    icon: <UserCheck className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("task.interviewWithMentor"),
    },
  },
  {
    type: "AI_INTERVIEW",
    title: t("adminInterviewTemplate.aiInterview.title"),
    description: t("adminInterviewTemplate.aiInterview.description"),
    color: "text-indigo-500 border-indigo-500/20",
    bgColor: "bg-indigo-500/10",
    icon: <Bot className="h-5 w-5" />,
    defaultConfig: {
      instruction: t("task.interviewWithAI"),
      timeLimitMinutes: 20,
      aiSystemPrompt: t("task.techRecruiterRole"),
      evaluationCriteria: t("task.evaluationCriteria"),
    },
  },
];

// Helper function to compute distance from a point to a line segment
const getDistanceToSegment = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = x1 + clampedT * dx;
  const projY = y1 + clampedT * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
};

// Helper function to find the best connection points between two cards
const getBestConnection = (fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
  const CARD_W = 208;
  const CARD_H = 130;

  const fromPorts = [
    { x: fromPos.x + CARD_W, y: fromPos.y + CARD_H / 2, nx: 1, ny: 0 }, // Right
    { x: fromPos.x, y: fromPos.y + CARD_H / 2, nx: -1, ny: 0 }, // Left
    { x: fromPos.x + CARD_W / 2, y: fromPos.y + CARD_H, nx: 0, ny: 1 }, // Bottom
    { x: fromPos.x + CARD_W / 2, y: fromPos.y, nx: 0, ny: -1 }, // Top
  ];

  const toPorts = [
    { x: toPos.x + CARD_W, y: toPos.y + CARD_H / 2, nx: 1, ny: 0 }, // Right
    { x: toPos.x, y: toPos.y + CARD_H / 2, nx: -1, ny: 0 }, // Left
    { x: toPos.x + CARD_W / 2, y: toPos.y + CARD_H, nx: 0, ny: 1 }, // Bottom
    { x: toPos.x + CARD_W / 2, y: toPos.y, nx: 0, ny: -1 }, // Top
  ];

  let bestDist = Infinity;
  let bestFrom = fromPorts[0];
  let bestTo = toPorts[1];

  for (const f of fromPorts) {
    for (const t of toPorts) {
      const dx = f.x - t.x;
      const dy = f.y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestFrom = f;
        bestTo = t;
      }
    }
  }

  // Calculate control points based on distance
  const cpDist = Math.min(Math.max(bestDist * 0.35, 45), 160);
  const cp1x = bestFrom.x + bestFrom.nx * cpDist;
  const cp1y = bestFrom.y + bestFrom.ny * cpDist;
  const cp2x = bestTo.x + bestTo.nx * cpDist;
  const cp2y = bestTo.y + bestTo.ny * cpDist;

  return {
    x1: bestFrom.x,
    y1: bestFrom.y,
    x2: bestTo.x,
    y2: bestTo.y,
    cp1x,
    cp1y,
    cp2x,
    cp2y,
  };
};

export function InterviewTemplateManagementPage() {
  const { t } = useTranslation();
  const AVAILABLE_ROUNDS_TEMPLATES = useMemo(() => getAvailableRoundsTemplates(t), [t]);
  const [templates, setTemplates] = useState<SummaryResponse[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DetailResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editor Dialog Canvas States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [rounds, setRounds] = useState<UIRound[]>([]);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isSaving, setIsSaving] = useState(false);
  const codingEditorRef = useRef<{
    saveCurrentProblem: () => Promise<
      | boolean
      | { ids: number[]; problems: { problemId?: number; title?: string; difficulty?: string }[] }
    >;
  }>(null);
  const codeReviewEditorRef = useRef<{
    saveCurrentProblem: () => Promise<
      | boolean
      | {
          ids: number[];
          problems: {
            problemId?: number;
            title?: string;
            difficulty?: string;
            language?: string;
          }[];
        }
    >;
  }>(null);
  const [dialogEditingTime, setDialogEditingTime] = useState(false);

  // Unsaved changes tracking states
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const initialDataRef = useRef<{
    rounds: string;
    name: string;
    category: string;
    desc: string;
  }>({
    rounds: "",
    name: "",
    category: "",
    desc: "",
  });

  useEffect(() => {
    if (isEditorOpen) {
      initialDataRef.current = {
        rounds: JSON.stringify(rounds),
        name: templateName,
        category: templateCategory,
        desc: templateDescription,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorOpen]);

  const hasUnsavedChanges =
    isEditorOpen &&
    (JSON.stringify(rounds) !== initialDataRef.current.rounds ||
      templateName !== initialDataRef.current.name ||
      templateCategory !== initialDataRef.current.category ||
      templateDescription !== initialDataRef.current.desc);

  // Drag and drop states
  const [activeDragType, setActiveDragType] = useState<RoundType | null>(null);
  const [dragOverGap, setDragOverGap] = useState<number | null>(null);

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // State for moving a card via pointer drag
  const [movingCardIdx, setMovingCardIdx] = useState<number | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync positions array length whenever rounds count changes
  useEffect(() => {
    setPositions((prev) => {
      const next = prev.slice(0, rounds.length);
      for (let i = next.length; i < rounds.length; i++) {
        // Default grid layout: 3 columns
        next.push({ x: (i % 3) * 300 + 40, y: Math.floor(i / 3) * 210 + 40 });
      }
      return next;
    });
  }, [rounds.length]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.0, parseFloat((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.4, parseFloat((z - 0.15).toFixed(2))));
  const handleZoomReset = () => setZoomLevel(1.0);

  // Register wheel handler natively to allow preventDefault (non-passive)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const zoomFactor = 1.15;
        let newZoom = zoomLevel;
        if (e.deltaY < 0) {
          newZoom = Math.min(2.0, parseFloat((zoomLevel * zoomFactor).toFixed(2)));
        } else {
          newZoom = Math.max(0.4, parseFloat((zoomLevel / zoomFactor).toFixed(2)));
        }

        if (newZoom === zoomLevel) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const canvasX = (mouseX + container.scrollLeft) / zoomLevel;
        const canvasY = (mouseY + container.scrollTop) / zoomLevel;

        setZoomLevel(newZoom);

        container.scrollLeft = canvasX * newZoom - mouseX;
        container.scrollTop = canvasY * newZoom - mouseY;
      }
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, [zoomLevel, rounds.length, isEditorOpen]);

  // Panning handlers on the canvas background
  const handleBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    if (
      (e.target as HTMLElement).closest(".round-card") ||
      (e.target as HTMLElement).closest("button")
    )
      return;

    setIsPanning(true);
    if (scrollContainerRef.current) {
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !scrollContainerRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
  };

  const handleBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Drag and drop handlers
  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedType = (e.dataTransfer.getData("text/plain") as RoundType) || activeDragType;
    if (!draggedType) return;

    const template = AVAILABLE_ROUNDS_TEMPLATES.find((t) => t.type === draggedType);
    if (!template) return;

    const newRound: UIRound = {
      name: template.title,
      roundType: draggedType,
      passThreshold: 0.8,
      configData: JSON.parse(JSON.stringify(template.defaultConfig)),
    };

    if (rounds.length === 0) {
      setRounds([newRound].map((r, idx) => ({ ...r, roundOrder: idx + 1 })));
      setPositions([{ x: 80, y: 80 }]);
      setActiveDragType(null);
      toast.success(`Đã thêm vòng ${template.title}`);
      return;
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = (e.clientX - rect.left) / zoomLevel - 104;
    const dropY = (e.clientY - rect.top) / zoomLevel - 60;

    const CARD_W = 208;
    const CARD_H = 130;
    const dropCenter = { x: dropX + CARD_W / 2, y: dropY + CARD_H / 2 };

    let insertIndex = rounds.length;
    let minDistance = Infinity;

    for (let i = 0; i < rounds.length - 1; i++) {
      const from = positions[i];
      const to = positions[i + 1];
      if (from && to) {
        const cx1 = from.x + CARD_W / 2;
        const cy1 = from.y + CARD_H / 2;
        const cx2 = to.x + CARD_W / 2;
        const cy2 = to.y + CARD_H / 2;

        const dist = getDistanceToSegment(dropCenter.x, dropCenter.y, cx1, cy1, cx2, cy2);
        if (dist < minDistance) {
          minDistance = dist;
          insertIndex = i + 1;
        }
      }
    }

    const shouldInsert = minDistance < 120;
    const finalIndex = shouldInsert ? insertIndex : rounds.length;

    const updatedRounds = [...rounds];
    updatedRounds.splice(finalIndex, 0, newRound);

    const newPositions = [...positions];
    newPositions.splice(finalIndex, 0, { x: Math.max(8, dropX), y: Math.max(8, dropY) });

    setRounds(updatedRounds.map((r, idx) => ({ ...r, roundOrder: idx + 1 })));
    setPositions(newPositions);
    setActiveDragType(null);
    toast.success(`Đã thêm vòng ${template.title}`);
  };

  // Card pointer handlers for moving and clicking
  const handleCardPointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pos = positions[idx] ?? { x: 0, y: 0 };
    setMovingCardIdx(idx);
    setMoveOffset({ x: e.clientX / zoomLevel - pos.x, y: e.clientY / zoomLevel - pos.y });
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    if (movingCardIdx !== idx) return;
    const newX = e.clientX / zoomLevel - moveOffset.x;
    const newY = e.clientY / zoomLevel - moveOffset.y;
    setPositions((prev) => {
      const next = [...prev];
      next[idx] = { x: Math.max(0, newX), y: Math.max(0, newY) };
      return next;
    });
  };

  const handleCardPointerUp = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    if (movingCardIdx !== idx) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setMovingCardIdx(null);

    const startX = dragStartPos.x;
    const startY = dragStartPos.y;
    const endX = e.clientX;
    const endY = e.clientY;
    const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

    if (dist < 4) {
      setSelectedRoundIndex(idx);
      setConfigModalOpen(true);
    } else {
      const myPos = positions[idx];
      if (myPos) {
        const CARD_W = 208;
        const CARD_H = 130;
        let overlapIdx = -1;

        for (let i = 0; i < positions.length; i++) {
          if (i === idx) continue;
          const otherPos = positions[i];
          if (otherPos) {
            const isOverlapping =
              myPos.x < otherPos.x + CARD_W &&
              myPos.x + CARD_W > otherPos.x &&
              myPos.y < otherPos.y + CARD_H &&
              myPos.y + CARD_H > otherPos.y;
            if (isOverlapping) {
              overlapIdx = i;
              break;
            }
          }
        }

        if (overlapIdx !== -1) {
          const newRounds = [...rounds];
          const tempRound = newRounds[idx];
          newRounds[idx] = newRounds[overlapIdx];
          newRounds[overlapIdx] = tempRound;

          const newPositions = [...positions];
          const tempPos = newPositions[idx];
          newPositions[idx] = newPositions[overlapIdx];
          newPositions[overlapIdx] = tempPos;

          setRounds(newRounds.map((r, i) => ({ ...r, roundOrder: i + 1 })));
          setPositions(newPositions);
          toast.success(`Đã đổi vị trí vòng ${idx + 1} và vòng ${overlapIdx + 1}`);
        }
      }
    }
  };

  const handleRemoveRound = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rounds
      .filter((_, idx) => idx !== index)
      .map((r, idx) => ({ ...r, roundOrder: idx + 1 }));
    setRounds(updated);
    setPositions((prev) => prev.filter((_, idx) => idx !== index));
    if (selectedRoundIndex === index) {
      setSelectedRoundIndex(null);
    } else if (selectedRoundIndex !== null && selectedRoundIndex > index) {
      setSelectedRoundIndex(selectedRoundIndex - 1);
    }
    toast.info(t("template.roundRemoved"));
  };

  const updateRoundField = (index: number, field: keyof UIRound, value: unknown) => {
    const updated = [...rounds];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setRounds(updated);
  };

  const updateRoundConfigField = (index: number, field: string, value: unknown) => {
    const updated = [...rounds];
    const currentConfig = updated[index].configData || {};
    updated[index] = {
      ...updated[index],
      configData: {
        ...currentConfig,
        [field]: value,
      },
    };
    setRounds(updated);
  };

  // Fetch templates list
  const loadTemplates = async () => {
    setIsLoadingList(true);
    const res = await interviewTemplateManager.getAllTemplates();
    if (res.success && res.data) {
      setTemplates(res.data);
    } else {
      toast.error(res.error || t("adminCompanymanagement.unableToLoadProcessTemplates"));
    }
    setIsLoadingList(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Fetch selected template details
  useEffect(() => {
    if (selectedTemplateId) {
      setIsLoadingDetail(true);
      interviewTemplateManager
        .getTemplateById(selectedTemplateId)
        .then((res) => {
          if (res.success && res.data) {
            setSelectedTemplate(res.data);
          } else {
            toast.error(res.error || t("adminCompanymanagement.unableToLoadTemplateDetails"));
            setSelectedTemplate(null);
          }
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId]);

  const handleDeleteTemplate = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(t("adminCompanymanagement.confirmDeleteTemplate"))) return;

    setIsDeleting(true);
    const res = await interviewTemplateManager.deleteTemplate(id);
    if (res.success) {
      toast.success(t("adminCompanymanagement.deletedRecruitmentTemplateSuccessfully"));
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
      }
      loadTemplates();
    } else {
      toast.error(res.error || t("adminCompanymanagement.unableToDeleteProcessTemplate"));
    }
    setIsDeleting(false);
  };

  const handleCreateClick = () => {
    setEditorMode("create");
    setTemplateName("");
    setTemplateCategory("");
    setTemplateDescription("");
    setRounds([
      {
        name: t("adminInterviewTemplate.cvScreening.title"),
        roundType: "CV_SCREENING",
        passThreshold: 0.8,
        configData: {
          instruction: t("cv.uploadPdfOnly"),
          submissionFormat: "pdf",
          timeLimitMinutes: 30,
          maxScore: 100,
        },
      },
    ]);
    // Set default position
    setPositions([{ x: 100, y: 100 }]);
    setZoomLevel(1.0);
    setSelectedRoundIndex(null);
    setIsEditorOpen(true);
  };

  const handleEditClick = (template: DetailResponse) => {
    setEditorMode("edit");
    setTemplateName(template.name || "");
    setTemplateCategory(template.category || "");
    setTemplateDescription(template.description || "");

    const sortedRounds = [...(template.rounds || [])].sort(
      (a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0)
    );

    const uiRounds: UIRound[] = sortedRounds.map((r) => ({
      name: r.name,
      roundType: r.roundType as RoundType,
      passThreshold: r.passThreshold ?? 0.8,
      configData: {
        ...r.configData,
        codingProblemsId:
          r.configData?.codingProblems
            ?.map((cp) => cp.problemId)
            .filter((id): id is number => id !== undefined) ?? [],
        codingProblems: r.configData?.codingProblems ?? [],
        codeReviewProblemsId:
          r.configData?.codeReviewProblems
            ?.map((cp) => cp.problemId)
            .filter((id): id is number => id !== undefined) ?? [],
        codeReviewProblems: r.configData?.codeReviewProblems ?? [],
      },
    }));

    // Calculate layout grid positions
    const newPositions = uiRounds.map((_, idx) => ({
      x: (idx % 3) * 300 + 40,
      y: Math.floor(idx / 3) * 210 + 40,
    }));

    setRounds(uiRounds);
    setPositions(newPositions);
    setZoomLevel(1.0);
    setSelectedRoundIndex(null);
    setIsEditorOpen(true);
  };

  const handleEditRoundDirectly = (template: DetailResponse, roundIndex: number) => {
    setEditorMode("edit");
    setTemplateName(template.name || "");
    setTemplateCategory(template.category || "");
    setTemplateDescription(template.description || "");

    const clickedRound = template.rounds?.[roundIndex];
    const sortedRounds = [...(template.rounds || [])].sort(
      (a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0)
    );
    const sortedIndex = sortedRounds.findIndex((r) => r === clickedRound);

    const uiRounds: UIRound[] = sortedRounds.map((r) => ({
      name: r.name,
      roundType: r.roundType as RoundType,
      passThreshold: r.passThreshold ?? 0.8,
      configData: {
        ...r.configData,
        codingProblemsId:
          r.configData?.codingProblems
            ?.map((cp) => cp.problemId)
            .filter((id): id is number => id !== undefined) ?? [],
        codingProblems: r.configData?.codingProblems ?? [],
        codeReviewProblemsId:
          r.configData?.codeReviewProblems
            ?.map((cp) => cp.problemId)
            .filter((id): id is number => id !== undefined) ?? [],
        codeReviewProblems: r.configData?.codeReviewProblems ?? [],
      },
    }));

    const newPositions = uiRounds.map((_, idx) => ({
      x: (idx % 3) * 300 + 40,
      y: Math.floor(idx / 3) * 210 + 40,
    }));

    setRounds(uiRounds);
    setPositions(newPositions);
    setZoomLevel(1.0);
    setSelectedRoundIndex(sortedIndex !== -1 ? sortedIndex : 0);
    setConfigModalOpen(true);
  };

  const handleSaveTemplate = async (shouldCloseParent = true, customRounds?: UIRound[]) => {
    if (!templateName.trim()) {
      toast.error(t("adminCompanymanagement.pleaseEnterTemplateName"));
      return;
    }
    if (!templateCategory.trim()) {
      toast.error(t("adminCompanymanagement.pleaseEnterCategory"));
      return;
    }
    const roundsToSave = customRounds || rounds;
    if (roundsToSave.length === 0) {
      toast.error(t("template.addAtLeastOneRound"));
      return;
    }

    // Check validation for Quiz rounds
    const invalidQuizIndex = roundsToSave.findIndex(
      (r) =>
        r.roundType === "QUIZ" &&
        (!r.configData?.quizQuestions || r.configData.quizQuestions.length === 0)
    );
    if (invalidQuizIndex !== -1) {
      toast.error(`Vòng ${invalidQuizIndex + 1} (Trắc nghiệm) chưa cấu hình câu hỏi.`);
      setSelectedRoundIndex(invalidQuizIndex);
      setConfigModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: templateName.trim(),
        category: templateCategory.trim(),
        description: templateDescription.trim() || undefined,
        rounds: roundsToSave.map((r, idx) => ({
          name: r.name || `Vòng ${idx + 1}`,
          roundOrder: idx + 1,
          roundType: r.roundType as
            | "CV_SCREENING"
            | "EMAIL_SIMULATOR"
            | "QUIZ"
            | "AI_INTERVIEW"
            | "CODING"
            | "CODE_REVIEW"
            | "MENTROR_REVIEW",
          passThreshold: Number(r.passThreshold ?? 0.8),
          configData: {
            instruction: r.configData?.instruction || "",
            submissionFormat: r.configData?.submissionFormat || "",
            timeLimitMinutes: Number(r.configData?.timeLimitMinutes ?? 0),
            maxScore: Number(r.configData?.maxScore ?? 100),
            aiSystemPrompt: r.configData?.aiSystemPrompt || "",
            evaluationCriteria: r.configData?.evaluationCriteria || "",
            quizQuestions: (r.configData?.quizQuestions || []).map((q) => ({
              questionText: q.questionText || "",
              options: q.options || [],
              correctAnswer: q.correctAnswer || "",
              points: Number(q.points ?? 0),
            })),
            codingProblems:
              r.configData?.codingProblemsId?.map((id) => {
                const cp = r.configData?.codingProblems?.find(
                  (problem) => problem.problemId === id
                );
                return {
                  problemId: id,
                  title: cp?.title || `Bài tập #${id}`,
                  difficulty: (cp?.difficulty as "EASY" | "MEDIUM" | "HARD") || "MEDIUM",
                };
              }) ?? [],
            codeReviewProblems:
              r.configData?.codeReviewProblemsId?.map((id) => {
                const cp = r.configData?.codeReviewProblems?.find(
                  (problem) => problem.problemId === id
                );
                return {
                  problemId: id,
                  title: cp?.title || `Bài tập #${id}`,
                  difficulty: (cp?.difficulty as "EASY" | "MEDIUM" | "HARD") || "MEDIUM",
                  language: cp?.language || "Java",
                };
              }) ?? [],
          },
        })),
      };

      let res;
      if (editorMode === "create") {
        res = await interviewTemplateManager.createTemplate(payload);
      } else {
        res = await interviewTemplateManager.updateTemplate(selectedTemplateId!, payload);
      }

      if (res.success) {
        toast.success(
          editorMode === "create" ? t("template.createSuccess") : t("template.updateSuccess")
        );
        if (shouldCloseParent) {
          setIsEditorOpen(false);
        }
        setConfigModalOpen(false);
        setSelectedRoundIndex(null);
        loadTemplates();
        if (editorMode === "create" && typeof res.data === "number") {
          setSelectedTemplateId(res.data);
        } else if (selectedTemplateId) {
          // Refetch details
          setSelectedTemplateId(null);
          setTimeout(() => setSelectedTemplateId(selectedTemplateId), 50);
        }
      } else {
        toast.error(res.error || t("adminCompanymanagement.unableToSaveProcessTemplate"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("adminCompanymanagement.errorOccurredWhileSavingTemplate"));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTemplates = templates.filter(
    (tpl) =>
      tpl.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRound = selectedRoundIndex !== null ? rounds[selectedRoundIndex] : null;

  return (
    <div className="border-border/50 bg-background/50 flex h-[calc(100vh-6rem)] min-h-0 w-full overflow-hidden rounded-2xl border shadow-sm dark:border-slate-800">
      {/* 1. LEFT SIDEBAR: Templates List */}
      <div
        className={cn(
          "flex h-full w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-[320px] dark:border-slate-800 dark:bg-slate-900/10",
          selectedTemplateId ? "hidden md:flex" : "flex"
        )}>
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <LayoutTemplate className="h-5 w-5 text-indigo-500" />
              {t("adminAdmindashboard.processTemplate")}
            </h2>
            <Button
              size="sm"
              onClick={handleCreateClick}
              className="h-8 gap-1.5 rounded-lg !bg-indigo-600 px-3 text-xs font-semibold !text-white shadow-sm hover:!bg-indigo-700">
              <PlusCircle className="h-3.5 w-3.5" />
              {t("general.createTemplate")}
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("adminCompanymanagement.searchTemplateAndCategory")}
              className="h-9 border-slate-200 bg-slate-50 pl-9 text-xs dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
        </div>

        {/* Scrollable Templates List */}
        <ScrollArea className="flex-1">
          {isLoadingList ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-xs">{t("adminCompanymanagement.loadingTemplateList")}</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 py-16 text-center text-slate-400 dark:text-slate-500">
              <LayoutTemplate className="mb-2 h-10 w-10 text-slate-300" />
              <span className="text-xs font-bold">{t("template.noTemplateFound")}</span>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id!)}
                    className={cn(
                      "group flex cursor-pointer items-start justify-between rounded-xl p-3 transition-all duration-200 select-none",
                      isSelected
                        ? "bg-slate-100 dark:bg-slate-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    )}>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tpl.category && (
                          <span className="inline-block rounded-full bg-slate-200/60 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                            {tpl.category}
                          </span>
                        )}
                      </div>
                      <h4
                        className={cn(
                          "mt-1 truncate text-sm font-bold",
                          isSelected
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-800 dark:text-slate-200"
                        )}>
                        {tpl.name}
                      </h4>
                      {tpl.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {tpl.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteTemplate(tpl.id!, e)}
                      className="p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 2. RIGHT PANEL: Details View */}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20",
          selectedTemplateId ? "flex" : "hidden md:flex"
        )}>
        {selectedTemplateId ? (
          isLoadingDetail ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
              <span className="mt-2 text-sm">{t("general.loadingDetails")}</span>
            </div>
          ) : selectedTemplate ? (
            <div className="flex h-full flex-col">
              {/* Detail Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/20">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      {selectedTemplate.category}
                    </span>
                    <button
                      onClick={() => setSelectedTemplateId(null)}
                      className="text-xs text-indigo-500 hover:underline md:hidden">
                      &larr; {t("common.goBack")}
                    </button>
                  </div>
                  <h2 className="mt-1.5 truncate text-xl font-bold text-slate-900 dark:text-white">
                    {selectedTemplate.name}
                  </h2>
                  {selectedTemplate.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(selectedTemplate)}
                    className="h-9 gap-1.5 border-slate-200 px-3 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white">
                    <Edit3 className="h-4 w-4" />
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(selectedTemplate.id!)}
                    disabled={isDeleting}
                    className="h-9 gap-1.5 border-red-200 px-3 font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-950/40 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                    {t("common.clear")} {/*mẫu*/}
                  </Button>
                </div>
              </div>

              {/* Detail Body (Rounds timeline) */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-slate-300">
                      {t("template.processContains")} {selectedTemplate.rounds?.length || 0}{" "}
                      {t("userApplicationhistory.rounds")} {/*phỏng vấn*/}
                    </h3>
                  </div>

                  {/* Vertical Timeline */}
                  <div className="relative space-y-5 pl-12 before:absolute before:top-2 before:bottom-2 before:left-[29px] before:w-[1.5px] before:bg-slate-200 dark:before:bg-slate-800">
                    {selectedTemplate.rounds?.map((round, idx) => {
                      const templateMetadata = AVAILABLE_ROUNDS_TEMPLATES.find(
                        (t) => t.type === round.roundType
                      );
                      const metadata = templateMetadata || {
                        title: round.roundType || "",
                        color: "text-slate-500 border-slate-200",
                        bgColor: "bg-slate-100",
                        icon: <FileText className="h-4 w-4" />,
                      };

                      return (
                        <div key={idx} className="group relative">
                          {/* Dot step number */}
                          <div className="dark:bg-slate-850 absolute top-1 -left-[30px] flex h-[23px] w-[23px] items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm dark:border-slate-950 dark:text-slate-400">
                            {idx + 1}
                          </div>

                          <div
                            onClick={() => handleEditRoundDirectly(selectedTemplate, idx)}
                            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-500/50 hover:bg-slate-50/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-400/50 dark:hover:bg-slate-900">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "rounded-xl p-2",
                                    metadata.bgColor,
                                    metadata.color
                                  )}>
                                  {metadata.icon}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {round.name}
                                  </h4>
                                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                    {metadata.title}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 opacity-70" />
                                  {round.configData?.timeLimitMinutes
                                    ? `${round.configData.timeLimitMinutes} phút`
                                    : t("enterpriseJobdescriptiondetailpage.unlimited")}
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {t("common.obtain")}{" "}
                                  {Math.round((round.passThreshold ?? 0.8) * 100)}%
                                </span>
                              </div>
                            </div>

                            {round.configData?.instruction && (
                              <div className="border-slate-150/40 mt-3 rounded-lg border bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-950/40 dark:text-slate-400">
                                <span className="mb-1 block font-bold text-slate-800 dark:text-slate-300">
                                  {t("template.candidateInstructions")}
                                </span>
                                {round.configData.instruction}
                              </div>
                            )}

                            {/* Show Quiz Questions preview if available */}
                            {round.roundType === "QUIZ" &&
                              round.configData?.quizQuestions &&
                              round.configData.quizQuestions.length > 0 && (
                                <div className="mt-3 border-t border-slate-100/10 pt-2 dark:border-slate-800/20">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                                    {t("template.configured")}{" "}
                                    {round.configData.quizQuestions.length}{" "}
                                    {t("question.multipleChoice")}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
              <AlertTriangle className="mb-2 h-8 w-8 text-amber-500" />
              <span>{t("template.failedToLoadDetails")}</span>
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50/40 dark:bg-indigo-950/10">
              <LayoutTemplate className="h-10 w-10 text-indigo-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
              {t("adminCompanymanagement.processTemplate")}
            </h2>
            <p className="max-w-sm text-sm text-slate-400 dark:text-slate-500">
              {t("template.selectFromList")}
            </p>
          </div>
        )}
      </main>

      <Dialog
        open={isEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (hasUnsavedChanges) {
              setShowExitConfirm(true);
            } else {
              setIsEditorOpen(false);
            }
          }
        }}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[95vh] max-h-[95vh] w-[98vw] max-w-[98vw] flex-row gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
          {/* 3.1 Toolbox Sidebar (Left) */}
          <div className="flex h-full w-[28%] max-w-[340px] min-w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
            <div className="flex h-[72px] shrink-0 flex-col justify-center border-b border-slate-200 bg-slate-100/30 px-5 dark:border-slate-800 dark:bg-slate-900/20">
              <h3 className="text-slate-750 text-xs font-bold tracking-wider uppercase dark:text-slate-400">
                {t("adminCompanymanagement.recruitmentRoundTemplate")}
              </h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                {t("template.dragToCenter")}
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
              <div className="my-auto space-y-3.5 py-2">
                {AVAILABLE_ROUNDS_TEMPLATES.map((template) => (
                  <div
                    key={template.type}
                    draggable
                    onDragStart={() => setActiveDragType(template.type)}
                    onDragEnd={() => setActiveDragType(null)}
                    className={cn(
                      "group flex cursor-grab items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900",
                      template.bgColor,
                      template.color
                    )}>
                    <div className="mt-0.5 shrink-0 rounded-xl bg-slate-100 p-2 shadow-inner dark:bg-black/40">
                      {template.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm leading-tight font-bold text-slate-800 transition-colors group-hover:text-slate-950 dark:text-slate-200 dark:group-hover:text-white">
                        {template.title}
                      </h4>
                      <p className="group-hover:text-slate-650 mt-1 text-xs leading-normal text-slate-500 dark:text-slate-400 dark:group-hover:text-slate-300">
                        {template.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.2 Main Editor Area (Center + Zoom Header + Workspace) */}
          <div className="bg-slate-55 relative flex h-full min-w-0 flex-1 flex-col overflow-hidden dark:bg-slate-950">
            {/* Header inside the center/main column with Metadata Inputs */}
            <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex flex-1 items-center gap-3">
                <div className="max-w-[200px] flex-1">
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t("adminCompanymanagement.templateNamePlaceholder")}
                    className="h-9 border-slate-200 bg-slate-50 text-xs font-bold dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="max-w-[150px] flex-1">
                  <Input
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder={t("template.categoryRequired")}
                    className="h-9 border-slate-200 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="hidden max-w-[300px] flex-1 sm:block">
                  <Input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder={t("template.descriptionPlaceholder")}
                    className="h-9 border-slate-200 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Zoom controls + round count */}
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {rounds.length} {t("userApplicationhistory.rounds")}
                </span>
                <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={handleZoomOut}
                    title={t("adminCompanymanagement.zoomOut")}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[36px] text-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    title={t("adminCompanymanagement.zoomIn")}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    title={t("adminCompanymanagement.resetZoom")}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Workspace Canvas viewport */}
            <div className="flex min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
              {rounds.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverGap(0);
                  }}
                  onDragLeave={() => setDragOverGap(null)}
                  onDrop={handleCanvasDrop}
                  className="flex flex-1 items-center justify-center p-8 select-none">
                  <div
                    className={cn(
                      "flex h-52 w-96 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300",
                      dragOverGap === 0
                        ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-slate-300 bg-white/60 dark:border-slate-700 dark:bg-slate-900/20"
                    )}>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <ArrowRight className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {t("template.emptyTemplate")}
                    </h4>
                    <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                      {/*Kéo các*/} {t("userApplicationhistory.rounds")} từ cột bên trái và thả vào
                      đây để thiết lập
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  ref={scrollContainerRef}
                  className={cn(
                    "relative h-full w-full overflow-auto select-none",
                    isPanning ? "cursor-grabbing" : "cursor-grab"
                  )}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCanvasDrop}
                  onPointerDown={handleBgPointerDown}
                  onPointerMove={handleBgPointerMove}
                  onPointerUp={handleBgPointerUp}>
                  {(() => {
                    const baseWidth = Math.max(
                      2400,
                      positions.reduce((m, p) => Math.max(m, (p?.x ?? 0) + 280), 0) + 200
                    );
                    const baseHeight = Math.max(
                      1600,
                      positions.reduce((m, p) => Math.max(m, (p?.y ?? 0) + 180), 0) + 200
                    );
                    return (
                      <div
                        style={{
                          width: `${baseWidth * zoomLevel}px`,
                          height: `${baseHeight * zoomLevel}px`,
                          position: "relative",
                        }}>
                        <div
                          ref={canvasRef}
                          style={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: "top left",
                            width: `${baseWidth}px`,
                            height: `${baseHeight}px`,
                            position: "absolute",
                            top: 0,
                            left: 0,
                          }}>
                          {/* SVG arrow connection layer */}
                          {rounds.length > 1 && (
                            <svg
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                pointerEvents: "none",
                                overflow: "visible",
                              }}>
                              <defs>
                                <marker
                                  id="arrow-head"
                                  markerWidth="8"
                                  markerHeight="8"
                                  refX="6"
                                  refY="3"
                                  orient="auto">
                                  <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                                </marker>
                              </defs>
                              {rounds.slice(0, -1).map((_, idx) => {
                                const from = positions[idx];
                                const to = positions[idx + 1];
                                if (!from || !to) return null;
                                const conn = getBestConnection(from, to);
                                return (
                                  <path
                                    key={idx}
                                    d={`M ${conn.x1} ${conn.y1} C ${conn.cp1x} ${conn.cp1y}, ${conn.cp2x} ${conn.cp2y}, ${conn.x2} ${conn.y2}`}
                                    stroke="#94a3b8"
                                    strokeWidth="1.8"
                                    strokeDasharray="6 4"
                                    fill="none"
                                    markerEnd="url(#arrow-head)"
                                  />
                                );
                              })}
                            </svg>
                          )}

                          {/* Round cards */}
                          {rounds.map((round, idx) => {
                            const pos = positions[idx] ?? {
                              x: (idx % 3) * 300 + 40,
                              y: Math.floor(idx / 3) * 210 + 40,
                            };
                            const template = AVAILABLE_ROUNDS_TEMPLATES.find(
                              (t) => t.type === round.roundType
                            );
                            const isSelected = selectedRoundIndex === idx;
                            const isMovingThis = movingCardIdx === idx;
                            return (
                              <div
                                key={idx}
                                style={{
                                  position: "absolute",
                                  left: pos.x,
                                  top: pos.y,
                                  width: 208,
                                  zIndex: isMovingThis ? 50 : isSelected ? 10 : 1,
                                  cursor: isMovingThis ? "grabbing" : "grab",
                                  userSelect: "none",
                                  touchAction: "none",
                                }}
                                className={cn(
                                  "round-card group rounded-2xl border bg-white p-4 shadow-md transition-shadow duration-150 dark:bg-slate-900/80 dark:shadow-lg",
                                  isSelected
                                    ? "border-blue-400 shadow-xl ring-2 ring-blue-400/30 dark:border-blue-500"
                                    : "border-slate-200 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:hover:border-slate-600",
                                  isMovingThis ? "shadow-2xl" : ""
                                )}
                                onPointerDown={(e) => handleCardPointerDown(e, idx)}
                                onPointerMove={(e) => handleCardPointerMove(e, idx)}
                                onPointerUp={(e) => handleCardPointerUp(e, idx)}>
                                {/* Step number badge */}
                                <div className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                  {idx + 1}
                                </div>

                                {/* Delete card button */}
                                <button
                                  onClick={(e) => handleRemoveRound(idx, e)}
                                  className="absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400"
                                  title={t("adminCompanymanagement.deleteRound")}>
                                  <Trash2 className="h-3 w-3" />
                                </button>

                                {/* Card content */}
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "rounded-xl p-2",
                                      template?.bgColor,
                                      template?.color
                                    )}>
                                    {template?.icon}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                                      {round.name}
                                    </h4>
                                    <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                      {template?.title}
                                    </p>
                                  </div>
                                </div>

                                {/* Stats footer */}
                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800/40 dark:text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 opacity-60" />
                                    <span>
                                      {round.configData?.timeLimitMinutes
                                        ? `${round.configData.timeLimitMinutes}p`
                                        : "∞"}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {t("common.obtain")}{" "}
                                    {Math.round((round.passThreshold ?? 0.8) * 100)}%
                                  </span>
                                </div>

                                {/* Quiz warning */}
                                {round.roundType === "QUIZ" &&
                                  (!round.configData?.quizQuestions ||
                                    round.configData.quizQuestions.length === 0) && (
                                    <div className="mt-2 flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-[10px] font-medium text-amber-500">
                                      <AlertTriangle className="h-3 w-3 shrink-0" />
                                      <span>{t("adminCompanymanagement.noQuestionsYet")}</span>
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer inside the editor Dialog */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <Button
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    setShowExitConfirm(true);
                  } else {
                    setIsEditorOpen(false);
                  }
                }}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={() => handleSaveTemplate(true)}
                disabled={isSaving}
                className="gap-2 bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700">
                <Save className="h-4 w-4" />
                {isSaving ? t("common.saving") : t("template.saveTemplate")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. CONFIG PANEL MODAL FOR SELECTED ROUND CARD */}
      {selectedRoundIndex !== null && selectedRound && (
        <Dialog
          open={configModalOpen}
          onOpenChange={(open) => {
            setConfigModalOpen(open);
            if (!open) setSelectedRoundIndex(null);
          }}>
          <DialogContent
            showCloseButton={false}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={cn(
              "flex flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950",
              selectedRound?.roundType === "QUIZ" ||
                selectedRound?.roundType === "CODING" ||
                selectedRound?.roundType === "CODE_REVIEW"
                ? "h-[96vh] max-h-[96vh] w-[98vw] max-w-[98vw]"
                : "h-auto max-h-[85vh] w-[960px] max-w-[96vw]"
            )}>
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/30">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "rounded-lg p-1.5",
                    AVAILABLE_ROUNDS_TEMPLATES.find((t) => t.type === selectedRound.roundType)
                      ?.bgColor,
                    AVAILABLE_ROUNDS_TEMPLATES.find((t) => t.type === selectedRound.roundType)
                      ?.color
                  )}>
                  {AVAILABLE_ROUNDS_TEMPLATES.find((t) => t.type === selectedRound.roundType)?.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span>
                      {t("userApplicationhistory.round")} {selectedRoundIndex + 1}:
                    </span>
                    <input
                      type="text"
                      value={selectedRound.name || ""}
                      onChange={(e) => updateRoundField(selectedRoundIndex, "name", e.target.value)}
                      className="-ml-1 w-48 rounded border-b border-transparent bg-transparent px-1 py-0.5 font-bold text-slate-900 hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:text-slate-100"
                      placeholder={t("adminCompanymanagement.recruitmentRoundName")}
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {
                      AVAILABLE_ROUNDS_TEMPLATES.find((t) => t.type === selectedRound.roundType)
                        ?.title
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={() => {
                  setConfigModalOpen(false);
                  setSelectedRoundIndex(null);
                }}>
                {t("compUi.close")}
              </Button>
            </div>

            <div
              className={cn(
                "flex-1 overflow-hidden",
                selectedRound.roundType !== "QUIZ" &&
                  selectedRound.roundType !== "CODING" &&
                  selectedRound.roundType !== "CODE_REVIEW" &&
                  "overflow-y-auto"
              )}>
              {selectedRound.roundType === "QUIZ" ? (
                <QuizEditor
                  questions={selectedRound.configData?.quizQuestions || []}
                  onChange={(questions) =>
                    updateRoundConfigField(selectedRoundIndex, "quizQuestions", questions)
                  }
                  maxScore={selectedRound.configData?.maxScore ?? 100}
                  onMaxScoreChange={(v) =>
                    updateRoundConfigField(selectedRoundIndex, "maxScore", v)
                  }
                  passThreshold={selectedRound.passThreshold ?? 0.8}
                  onPassThresholdChange={(v) =>
                    updateRoundField(selectedRoundIndex, "passThreshold", v)
                  }
                  timeLimitMinutes={selectedRound.configData?.timeLimitMinutes ?? 0}
                  onTimeLimitMinutesChange={(v) =>
                    updateRoundConfigField(selectedRoundIndex, "timeLimitMinutes", v)
                  }
                />
              ) : selectedRound.roundType === "CODING" ? (
                <CodingEditor
                  ref={codingEditorRef}
                  codingProblemsId={selectedRound.configData?.codingProblemsId || []}
                  codingProblems={selectedRound.configData?.codingProblems || []}
                  onChange={(ids, problems) => {
                    const updated = [...rounds];
                    updated[selectedRoundIndex] = {
                      ...updated[selectedRoundIndex],
                      configData: {
                        ...updated[selectedRoundIndex].configData,
                        codingProblemsId: ids,
                        codingProblems: problems,
                      },
                    };
                    setRounds(updated);
                  }}
                  maxScore={selectedRound.configData?.maxScore ?? 100}
                  onMaxScoreChange={(v) =>
                    updateRoundConfigField(selectedRoundIndex, "maxScore", v)
                  }
                  passThreshold={selectedRound.passThreshold ?? 0.8}
                  onPassThresholdChange={(v) =>
                    updateRoundField(selectedRoundIndex, "passThreshold", v)
                  }
                  timeLimitMinutes={selectedRound.configData?.timeLimitMinutes ?? 0}
                  onTimeLimitMinutesChange={(v) =>
                    updateRoundConfigField(selectedRoundIndex, "timeLimitMinutes", v)
                  }
                />
              ) : selectedRound.roundType === "CODE_REVIEW" ? (
                <CodeReviewEditor
                  ref={codeReviewEditorRef}
                  codeReviewProblemsId={selectedRound.configData?.codeReviewProblemsId || []}
                  codeReviewProblems={selectedRound.configData?.codeReviewProblems || []}
                  onChange={(ids, problems) => {
                    const updated = [...rounds];
                    updated[selectedRoundIndex] = {
                      ...updated[selectedRoundIndex],
                      configData: {
                        ...updated[selectedRoundIndex].configData,
                        codeReviewProblemsId: ids,
                        codeReviewProblems: problems,
                      },
                    };
                    setRounds(updated);
                  }}
                  maxScore={selectedRound.configData?.maxScore ?? 100}
                  onMaxScoreChange={(v) =>
                    updateRoundConfigField(selectedRoundIndex, "maxScore", v)
                  }
                  passThreshold={selectedRound.passThreshold ?? 0.8}
                  onPassThresholdChange={(v) =>
                    updateRoundField(selectedRoundIndex, "passThreshold", v)
                  }
                  timeLimitMinutes={selectedRound.configData?.timeLimitMinutes ?? 0}
                  onTimeLimitMinutesChange={(v) =>
                    updateRoundConfigField(selectedRoundIndex, "timeLimitMinutes", v)
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
                  {/* Left Column: General Configuration (col-span-5) */}
                  <div className="space-y-5 lg:col-span-5">
                    <div className="border-b border-slate-100 pb-2 dark:border-slate-800/40">
                      <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                        {t("general.generalConfiguration")}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {/* Max Score + Time in one row */}
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "space-y-1",
                            selectedRound.roundType === "CV_SCREENING" ||
                              selectedRound.roundType === "EMAIL_SIMULATOR"
                              ? "w-full"
                              : "w-[55%]"
                          )}>
                          <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                            {t("adminCompanymanagement.maximumScore")}
                          </Label>
                          <ScoreInput
                            value={selectedRound.configData?.maxScore ?? 100}
                            min={1}
                            max={500}
                            step={5}
                            accent="indigo"
                            variant="simple"
                            onChange={(v) =>
                              updateRoundConfigField(selectedRoundIndex, "maxScore", v)
                            }
                          />
                        </div>

                        {selectedRound.roundType !== "CV_SCREENING" &&
                          selectedRound.roundType !== "EMAIL_SIMULATOR" && (
                            <div className="w-[45%] space-y-1">
                              <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                {t("common.time")}
                              </Label>
                              {dialogEditingTime ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    autoFocus
                                    value={selectedRound.configData?.timeLimitMinutes ?? 0}
                                    onChange={(e) =>
                                      updateRoundConfigField(
                                        selectedRoundIndex,
                                        "timeLimitMinutes",
                                        Number(e.target.value)
                                      )
                                    }
                                    onBlur={() => setDialogEditingTime(false)}
                                    onKeyDown={(e) =>
                                      e.key === "Enter" && setDialogEditingTime(false)
                                    }
                                    className="h-11 w-full [appearance:textfield] border-slate-200 bg-white text-center text-xs font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <span className="shrink-0 text-[9px] text-slate-400">
                                    {t("common.minute")}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDialogEditingTime(true)}
                                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400">
                                  <Clock className="h-4 w-4 text-slate-400" />
                                  {(selectedRound.configData?.timeLimitMinutes ?? 0) > 0
                                    ? `${selectedRound.configData?.timeLimitMinutes} phút`
                                    : t("adminCompanymanagement.noLimit")}
                                </button>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Pass Score - circular */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                          {t("adminCompanymanagement.minimumPassingScore")}
                        </Label>
                        <div className="flex justify-center">
                          <ScoreInput
                            value={Math.round(
                              (selectedRound.passThreshold ?? 0.8) *
                                (selectedRound.configData?.maxScore ?? 100)
                            )}
                            min={0}
                            max={selectedRound.configData?.maxScore ?? 100}
                            step={1}
                            accent="emerald"
                            variant="circular"
                            size="sm"
                            onChange={(val) => {
                              const max = selectedRound.configData?.maxScore ?? 100;
                              updateRoundField(
                                selectedRoundIndex,
                                "passThreshold",
                                max > 0 ? val / max : 0.8
                              );
                            }}
                          />
                        </div>
                      </div>

                      {/* Định dạng nộp hồ sơ (only if CV_SCREENING) */}
                      {selectedRound.roundType === "CV_SCREENING" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("adminCompanymanagement.submissionFormat")}
                          </Label>
                          <Select
                            value={selectedRound.configData?.submissionFormat || "pdf"}
                            onValueChange={(val) =>
                              updateRoundConfigField(selectedRoundIndex, "submissionFormat", val)
                            }>
                            <SelectTrigger className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                              <SelectItem value="pdf">
                                {t("adminCompanymanagement.pdfFile")}
                              </SelectItem>
                              <SelectItem value="doc">
                                {t("adminCompanymanagement.wordFile")}
                              </SelectItem>
                              <SelectItem value="any">
                                {t("adminCompanymanagement.allDocumentFormats")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Lời Hướng dẫn cho ứng viên */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-4 dark:border-slate-800/40">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("adminCompanymanagement.instructionsForCandidates")}
                      </Label>
                      <Textarea
                        value={selectedRound.configData?.instruction || ""}
                        onChange={(e) =>
                          updateRoundConfigField(selectedRoundIndex, "instruction", e.target.value)
                        }
                        placeholder={
                          selectedRound.roundType === "CV_SCREENING"
                            ? t("template.exampleCvUpload")
                            : selectedRound.roundType === "EMAIL_SIMULATOR"
                              ? t("template.exampleCustomerService")
                              : t("adminCompanymanagement.instructionsForCandidatesPlaceholder")
                        }
                        rows={4}
                        className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Right Column: Round Specific Configurations (col-span-7) */}
                  <div className="space-y-5 lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-6 lg:dark:border-slate-800">
                    <div className="border-b border-slate-100 pb-2 dark:border-slate-800/40">
                      <h4 className="text-slate-450 text-xs font-bold tracking-wider uppercase dark:text-slate-500">
                        {t("general.detailedConfiguration")}
                      </h4>
                    </div>

                    {/* 1. CV_SCREENING Specific */}
                    {selectedRound.roundType === "CV_SCREENING" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("template.hrAddonCriteria")}
                          </Label>
                          <Textarea
                            value={selectedRound.configData?.aiSystemPrompt || ""}
                            onChange={(e) =>
                              updateRoundConfigField(
                                selectedRoundIndex,
                                "aiSystemPrompt",
                                e.target.value
                              )
                            }
                            placeholder={t("template.exampleHrCriteria")}
                            rows={6}
                            className="border-slate-200 bg-white text-xs text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          />
                          <p className="text-[10px] leading-normal text-slate-500">
                            {t("template.addonCriteriaExplanation")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. EMAIL_SIMULATOR Specific */}
                    {selectedRound.roundType === "EMAIL_SIMULATOR" && (
                      <div className="space-y-5">
                        {/* Đề bài / Tình huống giả lập Email */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("template.emailScenario")}
                          </Label>
                          <Textarea
                            value={selectedRound.configData?.evaluationCriteria || ""}
                            onChange={(e) =>
                              updateRoundConfigField(
                                selectedRoundIndex,
                                "evaluationCriteria",
                                e.target.value
                              )
                            }
                            placeholder={t("template.exampleEmailScenario")}
                            rows={6}
                            className="border-slate-200 bg-white text-xs text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          />
                        </div>

                        {/* Tiêu chí chấm điểm bổ sung của HR */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("template.hrAddonCriteria")}
                          </Label>
                          <Textarea
                            value={selectedRound.configData?.aiSystemPrompt || ""}
                            onChange={(e) =>
                              updateRoundConfigField(
                                selectedRoundIndex,
                                "aiSystemPrompt",
                                e.target.value
                              )
                            }
                            placeholder={t("template.exampleEmailCriteria")}
                            rows={6}
                            className="border-slate-200 bg-white text-xs text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          />
                          <p className="text-[10px] leading-normal text-slate-500">
                            {t("template.addonCriteriaExplanation")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* (Coding specific inputs removed since they are inline in CodingEditor) */}

                    {/* 5. AI INTERVIEW Specific */}
                    {selectedRound.roundType === "AI_INTERVIEW" && (
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            AI System Prompt
                          </Label>
                          <Textarea
                            value={selectedRound.configData?.aiSystemPrompt || ""}
                            onChange={(e) =>
                              updateRoundConfigField(
                                selectedRoundIndex,
                                "aiSystemPrompt",
                                e.target.value
                              )
                            }
                            placeholder={t("adminCompanymanagement.provideAiRoleConfigPrompt")}
                            rows={5}
                            className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          />
                        </div>
                        <div className="mt-4 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t("adminCompanymanagement.evaluationCriteria")}
                          </Label>
                          <Textarea
                            value={selectedRound.configData?.evaluationCriteria || ""}
                            onChange={(e) =>
                              updateRoundConfigField(
                                selectedRoundIndex,
                                "evaluationCriteria",
                                e.target.value
                              )
                            }
                            placeholder={t(
                              "adminCompanymanagement.candidateEvaluationCriteriaPlaceholder"
                            )}
                            rows={4}
                            className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
              <Button
                type="button"
                className="h-9 bg-indigo-600 px-4 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
                onClick={async () => {
                  let finalRounds = rounds;
                  if (selectedRound?.roundType === "CODING" && codingEditorRef.current) {
                    const result = await codingEditorRef.current.saveCurrentProblem();
                    if (!result) return;
                    if (result !== true) {
                      const updated = [...rounds];
                      updated[selectedRoundIndex] = {
                        ...updated[selectedRoundIndex],
                        configData: {
                          ...updated[selectedRoundIndex].configData,
                          codingProblemsId: result.ids,
                          codingProblems: result.problems,
                        },
                      };
                      finalRounds = updated;
                      setRounds(updated);
                    }
                  } else if (
                    selectedRound?.roundType === "CODE_REVIEW" &&
                    codeReviewEditorRef.current
                  ) {
                    const result = await codeReviewEditorRef.current.saveCurrentProblem();
                    if (!result) return;
                    if (result !== true) {
                      const updated = [...rounds];
                      updated[selectedRoundIndex] = {
                        ...updated[selectedRoundIndex],
                        configData: {
                          ...updated[selectedRoundIndex].configData,
                          codeReviewProblemsId: result.ids,
                          codeReviewProblems: result.problems,
                        },
                      };
                      finalRounds = updated;
                      setRounds(updated);
                    }
                  }
                  setConfigModalOpen(false);
                  setSelectedRoundIndex(null);
                  // Save template configurations immediately to backend
                  await handleSaveTemplate(false, finalRounds);
                }}>
                {t("template.saveTemplate")} {t("userApplicationhistory.rounds")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogContent className="max-w-md border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t("adminCompanymanagement.unsavedChanges")}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("template.unsavedChangesWarning2")}
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={() => setShowExitConfirm(false)}>
                {t("common.goBack")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-55 hover:text-red-650 h-8 border-red-200 text-xs text-red-500 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsEditorOpen(false);
                }}>
                {t("adminCompanymanagement.doNotSave")}
              </Button>
              <Button
                size="sm"
                className="bg-indigo-650 h-8 px-3.5 text-xs text-white hover:bg-indigo-700"
                onClick={async () => {
                  setShowExitConfirm(false);
                  await handleSaveTemplate();
                }}>
                {t("adminCompanymanagement.saveAndExit")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
