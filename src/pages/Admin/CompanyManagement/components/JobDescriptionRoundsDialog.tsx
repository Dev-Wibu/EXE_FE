import { Button } from "@/components/ui/button";
import { CodeReviewEditor } from "@/components/ui/code-review-editor";
import { CodingEditor } from "@/components/ui/coding-editor";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuizEditor } from "@/components/ui/quiz-editor";
import { ScoreInput } from "@/components/ui/score-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  SetupJdRoundsRequest,
  SummaryResponse,
  UpdateJdRoundRequest,
  User,
} from "@/interfaces";
import { cn } from "@/lib/utils";
import { interviewTemplateManager } from "@/services/interview-template.manager";
import { jobDescriptionManager } from "@/services/job-description.manager";
import { roundManager } from "@/services/round.manager";
import { usersAdminManager } from "@/services/users-admin.manager";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock,
  Code2,
  Eye,
  FileText,
  HelpCircle,
  Mail,
  RotateCcw,
  Save,
  Trash2,
  UserCheck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { JobDescription } from "../types";

// Types matching API
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
  reviewerId?: number | null;
  configData?: UIRoundConfig;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface JobDescriptionRoundsDialogProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  jobDescription: JobDescription | null;
  onSaved?: () => void;
}

// Available rounds configurations
const AVAILABLE_ROUNDS_TEMPLATES: {
  type: RoundType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  defaultConfig: UIRoundConfig;
}[] = [
  {
    type: "CV_SCREENING",
    title: "Lọc CV",
    description: "Đánh giá hồ sơ và kỹ năng ứng viên.",
    color: "text-blue-500 border-blue-500/20",
    bgColor: "bg-blue-500/10",
    icon: <FileText className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Vui lòng tải lên CV định dạng PDF.",
      submissionFormat: "pdf",
    },
  },
  {
    type: "EMAIL_SIMULATOR",
    title: "Mô phỏng Email",
    description: "Kiểm tra kỹ năng viết và giao tiếp qua Email.",
    color: "text-purple-500 border-purple-500/20",
    bgColor: "bg-purple-500/10",
    icon: <Mail className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Hãy trả lời email của khách hàng phàn nàn về sản phẩm.",
      timeLimitMinutes: 15,
    },
  },
  {
    type: "QUIZ",
    title: "Trắc nghiệm",
    description: "Bài đánh giá năng lực trắc nghiệm.",
    color: "text-amber-500 border-amber-500/20",
    bgColor: "bg-amber-500/10",
    icon: <HelpCircle className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Làm bài kiểm tra trắc nghiệm lý thuyết.",
      timeLimitMinutes: 20,
      quizQuestions: [],
    },
  },
  {
    type: "CODING",
    title: "Lập trình",
    description: "Đánh giá kỹ năng viết mã nguồn giải thuật.",
    color: "text-emerald-500 border-emerald-500/20",
    bgColor: "bg-emerald-500/10",
    icon: <Code2 className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Hoàn thành các bài tập lập trình yêu cầu.",
      timeLimitMinutes: 45,
      codingProblemsId: [],
    },
  },
  {
    type: "CODE_REVIEW",
    title: "Đánh giá Code",
    description: "Kiểm tra tư duy phản biện và tối ưu hóa code.",
    color: "text-teal-500 border-teal-500/20",
    bgColor: "bg-teal-500/10",
    icon: <Eye className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Review đoạn mã nguồn sau và chỉ ra các điểm cần tối ưu.",
      timeLimitMinutes: 30,
      codeReviewProblemsId: [],
      codeReviewProblems: [],
    },
  },
  {
    type: "MENTROR_REVIEW",
    title: "Đánh giá Mentor",
    description: "Buổi đánh giá trực tiếp cùng hội đồng chuyên gia.",
    color: "text-rose-500 border-rose-500/20",
    bgColor: "bg-rose-500/10",
    icon: <UserCheck className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Thực hiện phỏng vấn trực tiếp với Mentor.",
    },
  },
  {
    type: "AI_INTERVIEW",
    title: "Phỏng vấn AI",
    description: "Phỏng vấn giả lập tự động với Trợ lý AI.",
    color: "text-indigo-500 border-indigo-500/20",
    bgColor: "bg-indigo-500/10",
    icon: <Bot className="h-5 w-5" />,
    defaultConfig: {
      instruction: "Trả lời các câu hỏi phỏng vấn bằng giọng nói/văn bản với AI.",
      timeLimitMinutes: 20,
      aiSystemPrompt: "Bạn là một nhà tuyển dụng kỹ thuật chuyên hỏi về Java/NodeJS...",
      evaluationCriteria:
        "Đánh giá dựa trên kỹ năng giao tiếp, giải quyết vấn đề và kiến thức cốt lõi.",
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

type SetupRequestWithReviewer = {
  rounds?: (Omit<NonNullable<SetupJdRoundsRequest["rounds"]>[number], "reviewerId"> & {
    reviewerId?: number | null;
  })[];
};

type UpdateRequestWithReviewer = {
  rounds?: (Omit<NonNullable<UpdateJdRoundRequest["rounds"]>[number], "reviewerId"> & {
    reviewerId?: number | null;
  })[];
};

export function JobDescriptionRoundsDialog({
  isOpen,
  onOpenChange,
  jobDescription,
  onSaved,
}: JobDescriptionRoundsDialogProps) {
  const { t } = useTranslation();
  const [rounds, setRounds] = useState<UIRound[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingRounds, setHasExistingRounds] = useState(false);
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
  const initialRoundsRef = useRef<string>("");

  useEffect(() => {
    if (isOpen) {
      initialRoundsRef.current = JSON.stringify(rounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const hasUnsavedChanges = isOpen && JSON.stringify(rounds) !== initialRoundsRef.current;
  const [availableTypes, setAvailableTypes] = useState<RoundType[]>([]);

  // Templates management states
  const [activeTab, setActiveTab] = useState<"rounds" | "templates">("rounds");
  const [templates, setTemplates] = useState<SummaryResponse[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Drag and drop states
  const [activeDragType, setActiveDragType] = useState<RoundType | null>(null);
  const [dragOverGap, setDragOverGap] = useState<number | null>(null);

  // Zoom level for pipeline canvas
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Free-form canvas: position of each card {x, y} in canvas coordinates
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // State for moving a card via pointer drag
  const [movingCardIdx, setMovingCardIdx] = useState<number | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Sync positions array length whenever rounds count changes
  useEffect(() => {
    setPositions((prev) => {
      const next = prev.slice(0, rounds.length);
      for (let i = next.length; i < rounds.length; i++) {
        // Default grid layout: 3 columns, 260px col gap, 200px row gap
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

        // Calculate zoom direction
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

        // Position on canvas before zoom
        const canvasX = (mouseX + container.scrollLeft) / zoomLevel;
        const canvasY = (mouseY + container.scrollTop) / zoomLevel;

        // Set new zoom level
        setZoomLevel(newZoom);

        // Adjust scroll position to keep cursor centered
        container.scrollLeft = canvasX * newZoom - mouseX;
        container.scrollTop = canvasY * newZoom - mouseY;
      }
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, [zoomLevel, rounds.length]);

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

  // Load detailed JD information (including all rounds) and available round types
  useEffect(() => {
    if (isOpen && jobDescription?.id) {
      setIsLoading(true);
      setSelectedRoundIndex(null);

      const fetchJd = jobDescriptionManager.getById(jobDescription.id);
      const fetchTypes = roundManager.getAvailableRoundTypes();
      const fetchUsers = usersAdminManager.getAll();

      Promise.all([fetchJd, fetchTypes, fetchUsers])
        .then(([jdRes, typesRes, usersRes]) => {
          if (typesRes.success && typesRes.data) {
            setAvailableTypes(typesRes.data);
          } else {
            // Fallback to all if API fails
            setAvailableTypes(AVAILABLE_ROUNDS_TEMPLATES.map((t) => t.type));
          }

          if (usersRes.success && usersRes.data) {
            const allUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data;
            const staff = (allUsers || []).filter((u) => u.role === "STAFF");
            setStaffUsers(staff as User[]);
          }

          if (jdRes.success && jdRes.data) {
            const fetchedRounds = jdRes.data.rounds ?? [];
            // Sort by order
            const sortedRounds = [...fetchedRounds].sort(
              (a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0)
            );
            const uiRounds: UIRound[] = sortedRounds.map((r) => {
              let parsedConfig = r.configData;
              if (typeof r.configData === "string") {
                try {
                  parsedConfig = JSON.parse(r.configData);
                } catch (e) {
                  console.error("Failed to parse configData:", e);
                }
              }
              const configObj = (parsedConfig || {}) as UIRoundConfig;
              return {
                ...r,
                roundType: r.roundType as RoundType,
                reviewerId: (r as { reviewerId?: number | null }).reviewerId ?? null,
                configData: {
                  ...configObj,
                  codingProblemsId:
                    configObj.codingProblems
                      ?.map((cp) => cp.problemId)
                      .filter((id): id is number => id !== undefined) ?? [],
                  codingProblems: configObj.codingProblems ?? [],
                  codeReviewProblemsId:
                    configObj.codeReviewProblems
                      ?.map((cp) => cp.problemId)
                      .filter((id): id is number => id !== undefined) ?? [],
                  codeReviewProblems: configObj.codeReviewProblems ?? [],
                },
              };
            });
            setRounds(uiRounds);
            setHasExistingRounds(fetchedRounds.length > 0);

            // Load positions from localStorage if matching length
            try {
              const saved = localStorage.getItem(`inblue_jd_rounds_positions_${jobDescription.id}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === uiRounds.length) {
                  setPositions(parsed);
                  return;
                }
              }
            } catch (e) {
              console.error("Error loading positions from localStorage", e);
            }
          } else {
            setRounds([]);
            setHasExistingRounds(false);
          }
        })
        .catch((err) => {
          console.error("Error loading JD rounds/types:", err);
          toast.error("Không thể tải thông tin quy trình phỏng vấn.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, jobDescription]);

  const fetchTemplates = async () => {
    setIsTemplatesLoading(true);
    const res = await interviewTemplateManager.getAllTemplates();
    if (res.success && res.data) {
      setTemplates(res.data);
    } else {
      toast.error(res.error || "Không thể tải danh sách mẫu quy trình");
    }
    setIsTemplatesLoading(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === "templates") {
      fetchTemplates();
    }
  }, [isOpen, activeTab]);

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu quy trình này không?")) return;
    const res = await interviewTemplateManager.deleteTemplate(id);
    if (res.success) {
      toast.success("Đã xóa mẫu quy trình tuyển dụng thành công!");
      fetchTemplates();
    } else {
      toast.error(res.error || "Không thể xóa mẫu quy trình");
    }
  };

  const handleApplyTemplate = async (id: number) => {
    const res = await interviewTemplateManager.getTemplateById(id);
    if (res.success && res.data) {
      const template = res.data;
      if (!template.rounds || template.rounds.length === 0) {
        toast.error("Mẫu quy trình này không có vòng nào.");
        return;
      }

      // Sort rounds by order
      const sortedRounds = [...template.rounds].sort(
        (a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0)
      );

      const uiRounds: UIRound[] = sortedRounds.map((r) => ({
        name: r.name,
        roundType: r.roundType as RoundType,
        passThreshold: r.passThreshold ?? 0.8,
        reviewerId: (r as { reviewerId?: number | null }).reviewerId ?? null,
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

      // Calculate default layout positions for the new rounds count
      const newPositions = uiRounds.map((_, idx) => ({
        x: (idx % 3) * 300 + 40,
        y: Math.floor(idx / 3) * 210 + 40,
      }));

      setRounds(uiRounds);
      setPositions(newPositions);
      toast.success(`Đã áp dụng mẫu "${template.name}" thành công!`);
    } else {
      toast.error(res.error || "Không thể tải chi tiết mẫu quy trình");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Vui lòng nhập tên mẫu");
      return;
    }
    if (!templateCategory.trim()) {
      toast.error("Vui lòng nhập danh mục");
      return;
    }
    if (rounds.length === 0) {
      toast.error("Quy trình trống, không có vòng nào để lưu làm mẫu!");
      return;
    }

    setIsSavingTemplate(true);
    try {
      const payload = {
        name: templateName,
        category: templateCategory,
        description: templateDescription,
        rounds: rounds.map((r, idx) => ({
          name: r.name || `Vòng ${idx + 1}`,
          roundOrder: idx + 1,
          roundType: r.roundType as RoundType,
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
          },
        })),
      };

      const res = await interviewTemplateManager.createTemplate(payload);
      if (res.success) {
        toast.success("Đã lưu quy trình làm mẫu tuyển dụng thành công!");
        setTemplateName("");
        setTemplateCategory("");
        setTemplateDescription("");
        setSaveTemplateDialogOpen(false);
        fetchTemplates();
      } else {
        toast.error(res.error || "Không thể lưu mẫu quy trình");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("Đã xảy ra lỗi khi lưu mẫu");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Handle drop from toolbox onto the free-form canvas at a specific position
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

    // Determine insertion position based on distance to connections
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

    // Insert if close to a connection line (threshold: 120px)
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

  // Pointer handlers for moving cards on the free-form canvas
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

    // Calculate distance moved
    const startX = dragStartPos.x;
    const startY = dragStartPos.y;
    const endX = e.clientX;
    const endY = e.clientY;
    const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

    if (dist < 4) {
      // It's a simple click! Open the config modal immediately
      setSelectedRoundIndex(idx);
      setConfigModalOpen(true);
    } else {
      // Check overlap with other cards to swap order
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
    toast.info("Đã xóa vòng khỏi quy trình.");
  };

  // Update specific round field
  const updateRoundField = (index: number, field: keyof UIRound, value: unknown) => {
    const updated = [...rounds];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setRounds(updated);
  };

  // Update specific round config field
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

  // Save current rounds config to server
  // Save current rounds config to server
  const handleSave = async (shouldCloseParent = true, customRounds?: UIRound[]) => {
    if (!jobDescription?.id) return;
    setIsSaving(true);
    const roundsToSave = customRounds || rounds;

    try {
      // Validate rounds
      if (roundsToSave.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 vòng phỏng vấn.");
        setIsSaving(false);
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
        setIsSaving(false);
        return;
      }

      const payload: SetupRequestWithReviewer & UpdateRequestWithReviewer = {
        // Map UI format to Dto expected by Backend API
        rounds: roundsToSave.map((r, idx) => ({
          id: r.id,
          name: r.name || `Vòng ${idx + 1}`,
          roundOrder: idx + 1,
          roundType: r.roundType as RoundType,
          passThreshold: Number(r.passThreshold ?? 0.8),
          reviewerId: r.reviewerId || null,
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
            codingProblemsId: r.configData?.codingProblemsId || [],
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

      let response;
      if (hasExistingRounds) {
        response = await roundManager.updateForJd(
          jobDescription.id,
          payload as unknown as UpdateJdRoundRequest
        );
      } else {
        response = await roundManager.setUpForJd(
          jobDescription.id,
          payload as unknown as SetupJdRoundsRequest
        );
      }

      if (response.success) {
        localStorage.setItem(
          `inblue_jd_rounds_positions_${jobDescription.id}`,
          JSON.stringify(positions)
        );
        toast.success("Đã lưu thiết lập quy trình phỏng vấn thành công!");
        onSaved?.();
        if (shouldCloseParent) {
          onOpenChange(false);
        } else {
          // If we are not closing, reload updated rounds with database IDs
          const jdRes = await jobDescriptionManager.getById(jobDescription.id);
          if (jdRes.success && jdRes.data) {
            const fetchedRounds = jdRes.data.rounds ?? [];
            const sortedRounds = [...fetchedRounds].sort(
              (a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0)
            );
            const uiRounds: UIRound[] = sortedRounds.map((r) => {
              let parsedConfig = r.configData;
              if (typeof r.configData === "string") {
                try {
                  parsedConfig = JSON.parse(r.configData);
                } catch (e) {
                  console.error("Failed to parse configData:", e);
                }
              }
              const configObj = (parsedConfig || {}) as UIRoundConfig;
              return {
                ...r,
                roundType: r.roundType as RoundType,
                reviewerId: (r as { reviewerId?: number | null }).reviewerId ?? null,
                configData: {
                  ...configObj,
                  codingProblemsId:
                    configObj.codingProblems
                      ?.map((cp) => cp.problemId)
                      .filter((id): id is number => id !== undefined) ?? [],
                  codingProblems: configObj.codingProblems ?? [],
                  codeReviewProblemsId:
                    configObj.codeReviewProblems
                      ?.map((cp) => cp.problemId)
                      .filter((id): id is number => id !== undefined) ?? [],
                  codeReviewProblems: configObj.codeReviewProblems ?? [],
                },
              };
            });
            setRounds(uiRounds);
            setHasExistingRounds(fetchedRounds.length > 0);
          }
        }
      } else {
        toast.error(response.error || "Không thể lưu thiết lập quy trình.");
      }
    } catch (err) {
      console.error("Error saving rounds:", err);
      toast.error("Đã xảy ra lỗi khi lưu quy trình.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRound = selectedRoundIndex !== null ? rounds[selectedRoundIndex] : null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (hasUnsavedChanges) {
            setShowExitConfirm(true);
          } else {
            onOpenChange(false);
          }
        }
      }}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[95vh] max-h-[95vh] w-[98vw] max-w-[98vw] flex-row gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <span>Đang tải thông tin cấu hình...</span>
          </div>
        ) : (
          <>
            {/* 1. LEFT SIDEBAR: Available Rounds Toolbox (occupies full height) */}
            <div className="flex h-full w-[28%] max-w-[340px] min-w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
              {/* Tab Switcher Header */}
              <div className="flex h-[72px] shrink-0 flex-col justify-center border-b border-slate-200 bg-slate-100/30 px-4 dark:border-slate-800 dark:bg-slate-900/20">
                <div className="flex rounded-lg bg-slate-200/60 p-1 dark:bg-slate-800/60">
                  <button
                    onClick={() => setActiveTab("rounds")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-center text-xs font-bold transition-all duration-200",
                      activeTab === "rounds"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    )}>
                    Vòng đơn lẻ
                  </button>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-center text-xs font-bold transition-all duration-200",
                      activeTab === "templates"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    )}>
                    Mẫu quy trình
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
                {activeTab === "rounds" ? (
                  <div className="my-auto space-y-3.5 py-2">
                    {AVAILABLE_ROUNDS_TEMPLATES.filter((t) => availableTypes.includes(t.type)).map(
                      (template) => (
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
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {isTemplatesLoading ? (
                      <div className="text-slate-450 flex flex-col items-center justify-center gap-2 py-10 dark:text-slate-400">
                        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                        <span className="text-xs">Đang tải danh sách mẫu...</span>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500">
                        <Save className="text-slate-350 mb-2 h-8 w-8 dark:text-slate-600" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Chưa có mẫu nào
                        </span>
                        <p className="text-slate-450 mt-1 max-w-[200px] text-[11px] leading-normal dark:text-slate-500">
                          Thiết lập quy trình rồi bấm "Lưu quy trình làm mẫu" để lưu lại dùng cho
                          các lần sau.
                        </p>
                      </div>
                    ) : (
                      templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {tpl.category && (
                                <span className="dark:text-slate-450 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                                  {tpl.category}
                                </span>
                              )}
                              <h4
                                className="dark:text-slate-250 mt-1 truncate text-sm font-bold text-slate-800"
                                title={tpl.name ?? ""}>
                                {tpl.name}
                              </h4>
                            </div>
                          </div>
                          {tpl.description && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {tpl.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800/40">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(tpl.id!)}
                              className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40">
                              Xóa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyTemplate(tpl.id!)}
                              className="h-7 border-slate-200 px-2.5 text-xs hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white">
                              Áp dụng
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Save template action button under templates tab */}
              {activeTab === "templates" && (
                <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <Button
                    onClick={() => {
                      if (rounds.length === 0) {
                        toast.error("Quy trình trống, không thể lưu làm mẫu!");
                        return;
                      }
                      setSaveTemplateDialogOpen(true);
                    }}
                    className="w-full gap-2 bg-blue-600 font-bold text-white hover:bg-blue-700">
                    <Save className="h-4 w-4" />
                    Lưu quy trình làm mẫu
                  </Button>
                </div>
              )}
            </div>

            {/* MAIN CONTENT AREA: Header, Center Canvas & Right Config Panel, and Footer */}
            <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
              {/* Header inside the center/main column */}
              <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900/50">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    Thiết lập Quy trình Tuyển dụng
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Kéo thả từ danh sách bên trái vào pipeline &middot;{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {jobDescription?.title}
                    </span>
                  </p>
                </div>
                {/* Zoom controls + round count — moved to header */}
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {rounds.length} vòng
                  </span>
                  <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      onClick={handleZoomOut}
                      title="Thu nhỏ (Ctrl+Scroll)"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[36px] text-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      title="Phóng to (Ctrl+Scroll)"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleZoomReset}
                      title="Đặt lại zoom"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Workspace: Canvas + Right Panel */}
              <div className="flex min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
                {rounds.length === 0 ? (
                  /* Center empty state in workspace viewport */
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
                        Quy trình trống
                      </h4>
                      <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                        Kéo các vòng từ danh sách bên trái và thả vào đây để bắt đầu
                      </p>
                    </div>
                  </div>
                ) : (
                  /* FREE-FORM CANVAS: cards absolutely positioned, SVG arrows connect them */
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
                    {/* Intermediate wrapper that defines the actual scrollable dimensions under zoom */}
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
                          {/* Inner scaled canvas */}
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
                            {/* SVG arrow layer — draws bezier curves between consecutive rounds dynamically */}
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

                            {/* Round cards — absolutely positioned, pointer-draggable */}
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

                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => handleRemoveRound(idx, e)}
                                    className="absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400"
                                    title="Xóa vòng">
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
                                      Đạt {Math.round((round.passThreshold ?? 0.8) * 100)}%
                                    </span>
                                  </div>

                                  {/* Reviewer badge */}
                                  {round.reviewerId && (
                                    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
                                      <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                      <span className="truncate font-medium">
                                        {staffUsers.find((u) => u.id === round.reviewerId)?.name ||
                                          `ID: ${round.reviewerId}`}
                                      </span>
                                    </div>
                                  )}

                                  {/* Quiz warning */}
                                  {round.roundType === "QUIZ" &&
                                    (!round.configData?.quizQuestions ||
                                      round.configData.quizQuestions.length === 0) && (
                                      <div className="mt-2 flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-[10px] font-medium text-amber-500">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        <span>Chưa có câu hỏi</span>
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

              {/* 3. CONFIG MODAL — opens when user clicks a round card */}
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
                            AVAILABLE_ROUNDS_TEMPLATES.find(
                              (t) => t.type === selectedRound.roundType
                            )?.bgColor,
                            AVAILABLE_ROUNDS_TEMPLATES.find(
                              (t) => t.type === selectedRound.roundType
                            )?.color
                          )}>
                          {
                            AVAILABLE_ROUNDS_TEMPLATES.find(
                              (t) => t.type === selectedRound.roundType
                            )?.icon
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                            <span>Vòng {selectedRoundIndex + 1}:</span>
                            <input
                              type="text"
                              value={selectedRound.name || ""}
                              onChange={(e) =>
                                updateRoundField(selectedRoundIndex, "name", e.target.value)
                              }
                              className="-ml-1 w-48 rounded border-b border-transparent bg-transparent px-1 py-0.5 font-bold text-slate-900 hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:text-slate-100"
                              placeholder="Tên vòng tuyển dụng"
                            />
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {
                              AVAILABLE_ROUNDS_TEMPLATES.find(
                                (t) => t.type === selectedRound.roundType
                              )?.title
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
                        Đóng
                      </Button>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      {/* Reviewer Configuration Selection */}
                      <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-900/10">
                        <div className="max-w-md space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t("adminCompanymanagement.reviewer")}
                          </Label>
                          <Select
                            value={
                              selectedRound.reviewerId ? String(selectedRound.reviewerId) : "none"
                            }
                            onValueChange={(val) =>
                              updateRoundField(
                                selectedRoundIndex,
                                "reviewerId",
                                val === "none" ? null : Number(val)
                              )
                            }>
                            <SelectTrigger className="w-full border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                              <SelectValue
                                placeholder={t("adminCompanymanagement.selectReviewer")}
                              />
                            </SelectTrigger>
                            <SelectContent className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                              <SelectItem value="none">
                                {t("adminCompanymanagement.noReviewerAssigned")}
                              </SelectItem>
                              {staffUsers.map((staff) => (
                                <SelectItem key={staff.id} value={String(staff.id)}>
                                  {staff.name} ({staff.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex-1 overflow-hidden",
                          selectedRound.roundType !== "QUIZ" &&
                            selectedRound.roundType !== "CODING" &&
                            selectedRound.roundType !== "CODE_REVIEW" &&
                            "overflow-y-auto p-5"
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
                            codeReviewProblemsId={
                              selectedRound.configData?.codeReviewProblemsId || []
                            }
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
                          <div className="space-y-4 pb-6">
                            {/* General Settings */}
                            <div className="space-y-3 pb-3">
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
                                    Điểm tối đa
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
                                        Thời gian
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
                                            phút
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
                                            : "Không hạn chế"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* Pass Score - circular */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                  Điểm đạt tối thiểu
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
                            </div>

                            {/* Specific features depending on Round Type */}
                            <div className="border-t border-slate-800/60 pt-4">
                              {/* 1. CV_SCREENING */}
                              {selectedRound.roundType === "CV_SCREENING" && (
                                <>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      Định dạng nộp hồ sơ
                                    </Label>
                                    <Select
                                      value={selectedRound.configData?.submissionFormat || "pdf"}
                                      onValueChange={(val) =>
                                        updateRoundConfigField(
                                          selectedRoundIndex,
                                          "submissionFormat",
                                          val
                                        )
                                      }>
                                      <SelectTrigger className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                        <SelectItem value="pdf">Tệp PDF (.pdf)</SelectItem>
                                        <SelectItem value="doc">Tệp Word (.doc, .docx)</SelectItem>
                                        <SelectItem value="any">
                                          Tất cả định dạng tài liệu
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
                              )}

                              {/* (Coding specific inputs removed since they are inline in CodingEditor) */}

                              {/* 4. AI INTERVIEW */}
                              {selectedRound.roundType === "AI_INTERVIEW" && (
                                <>
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
                                      placeholder="Cung cấp prompt cấu hình vai trò AI..."
                                      rows={5}
                                      className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      Tiêu chuẩn Đánh giá
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
                                      placeholder="Các tiêu chuẩn đánh giá kết quả của ứng viên..."
                                      rows={4}
                                      className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                  </div>
                                </>
                              )}

                              {/* Instruction (Common for all) */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Lời Hướng dẫn cho ứng viên
                                </Label>
                                <Textarea
                                  value={selectedRound.configData?.instruction || ""}
                                  onChange={(e) =>
                                    updateRoundConfigField(
                                      selectedRoundIndex,
                                      "instruction",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Hướng dẫn ứng viên làm bài..."
                                  rows={4}
                                  className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
                          // Save immediately to backend without closing the main diagram
                          await handleSave(false, finalRounds);
                        }}>
                        Xác nhận thiết lập vòng
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* 4. SAVE AS TEMPLATE DIALOG */}
              <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
                <DialogContent
                  showCloseButton={false}
                  className="flex max-h-[85vh] w-[450px] max-w-[96vw] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Lưu quy trình phỏng vấn làm mẫu
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full px-3 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={() => setSaveTemplateDialogOpen(false)}>
                      Đóng
                    </Button>
                  </div>

                  <div className="flex-1 space-y-4 p-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Tên mẫu <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Ví dụ: FAANG Software Engineer..."
                        className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Danh mục <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                        placeholder="Ví dụ: Backend, Fullstack, DevOps..."
                        className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Mô tả mẫu quy trình
                      </Label>
                      <Textarea
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Mô tả mục đích hoặc tiêu chí của mẫu quy trình này..."
                        rows={4}
                        className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSaveTemplateDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSavingTemplate}
                      onClick={handleSaveAsTemplate}
                      className="bg-blue-600 font-bold text-white hover:bg-blue-700">
                      {isSavingTemplate ? "Đang lưu..." : "Lưu mẫu"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Footer inside the main column */}
              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setShowExitConfirm(true);
                    } else {
                      onOpenChange(false);
                    }
                  }}>
                  Hủy
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-bold">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Đang lưu..." : "Lưu thiết lập"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogContent className="max-w-md border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Thay đổi chưa được lưu
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Bạn có các thay đổi chưa được lưu trong quy trình tuyển dụng này. Bạn có muốn lưu lại
              thiết lập trước khi thoát không?
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={() => setShowExitConfirm(false)}>
                Quay lại
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-55 hover:text-red-655 h-8 border-red-200 text-xs text-red-500 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => {
                  setShowExitConfirm(false);
                  onOpenChange(false);
                }}>
                Không lưu
              </Button>
              <Button
                size="sm"
                className="bg-indigo-650 h-8 px-3.5 text-xs text-white hover:bg-indigo-700"
                onClick={async () => {
                  setShowExitConfirm(false);
                  await handleSave();
                }}>
                Lưu và Thoát
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
