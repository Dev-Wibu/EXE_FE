import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useEffect, useRef, useState } from "react";
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
}

interface UIRound {
  id?: number;
  name?: string;
  roundOrder?: number;
  roundType?: RoundType;
  passThreshold?: number;
  configData?: UIRoundConfig;
}

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
    },
  },
  {
    type: "MENTROR_REVIEW",
    title: "Đánh giá Mentor",
    description: "Buổi phỏng vấn trực tiếp với Mentor.",
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

export function InterviewTemplateManagementPage() {
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
    toast.info("Đã xóa vòng khỏi mẫu.");
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
      toast.error(res.error || "Không thể tải danh sách mẫu quy trình");
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
            toast.error(res.error || "Không thể tải chi tiết mẫu quy trình");
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
    if (!confirm("Bạn có chắc chắn muốn xóa mẫu quy trình này không?")) return;

    setIsDeleting(true);
    const res = await interviewTemplateManager.deleteTemplate(id);
    if (res.success) {
      toast.success("Đã xóa mẫu quy trình tuyển dụng thành công!");
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
      }
      loadTemplates();
    } else {
      toast.error(res.error || "Không thể xóa mẫu quy trình");
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
        name: "Lọc CV",
        roundType: "CV_SCREENING",
        passThreshold: 0.8,
        configData: {
          instruction: "Vui lòng tải lên CV định dạng PDF.",
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

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Vui lòng nhập tên mẫu");
      return;
    }
    if (!templateCategory.trim()) {
      toast.error("Vui lòng nhập danh mục");
      return;
    }
    if (rounds.length === 0) {
      toast.error("Vui lòng thêm ít nhất một vòng phỏng vấn cho mẫu này");
      return;
    }

    // Check validation for Quiz rounds
    const invalidQuizIndex = rounds.findIndex(
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
        rounds: rounds.map((r, idx) => ({
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
          editorMode === "create"
            ? "Tạo mẫu quy trình thành công!"
            : "Cập nhật mẫu quy trình thành công!"
        );
        setIsEditorOpen(false);
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
        toast.error(res.error || "Không thể lưu mẫu quy trình");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi lưu mẫu");
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
              Mẫu Quy trình
            </h2>
            <Button
              size="sm"
              onClick={handleCreateClick}
              className="h-8 gap-1.5 rounded-lg !bg-indigo-600 px-3 text-xs font-semibold !text-white shadow-sm hover:!bg-indigo-700">
              <PlusCircle className="h-3.5 w-3.5" />
              Tạo mẫu
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mẫu, danh mục..."
              className="h-9 border-slate-200 bg-slate-50 pl-9 text-xs dark:border-slate-800 dark:bg-slate-950"
            />
          </div>
        </div>

        {/* Scrollable Templates List */}
        <ScrollArea className="flex-1">
          {isLoadingList ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-xs">Đang tải danh sách mẫu...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 py-16 text-center text-slate-400 dark:text-slate-500">
              <LayoutTemplate className="mb-2 h-10 w-10 text-slate-300" />
              <span className="text-xs font-bold">Không tìm thấy mẫu nào</span>
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
              <span className="mt-2 text-sm">Đang tải thông tin chi tiết...</span>
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
                      &larr; Quay lại
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
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(selectedTemplate.id!)}
                    disabled={isDeleting}
                    className="h-9 gap-1.5 border-red-200 px-3 font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-950/40 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                    Xóa mẫu
                  </Button>
                </div>
              </div>

              {/* Detail Body (Rounds timeline) */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-slate-300">
                      Quy trình gồm {selectedTemplate.rounds?.length || 0} vòng phỏng vấn
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
                                    : "Không giới hạn"}
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  Đạt {Math.round((round.passThreshold ?? 0.8) * 100)}%
                                </span>
                              </div>
                            </div>

                            {round.configData?.instruction && (
                              <div className="border-slate-150/40 mt-3 rounded-lg border bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-950/40 dark:text-slate-400">
                                <span className="mb-1 block font-bold text-slate-800 dark:text-slate-300">
                                  Hướng dẫn ứng viên:
                                </span>
                                {round.configData.instruction}
                              </div>
                            )}

                            {/* Show Quiz Questions preview if available */}
                            {round.roundType === "QUIZ" &&
                              round.configData?.quizQuestions &&
                              round.configData.quizQuestions.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                    Câu hỏi trắc nghiệm ({round.configData.quizQuestions.length})
                                  </span>
                                  <div className="max-h-36 space-y-1.5 overflow-y-auto pt-1">
                                    {round.configData.quizQuestions.map((q, qIdx) => (
                                      <div
                                        key={qIdx}
                                        className="border-slate-150/20 rounded border bg-slate-50/30 p-2 text-xs text-slate-600 dark:text-slate-400">
                                        <strong>{qIdx + 1}.</strong> {q.questionText}
                                      </div>
                                    ))}
                                  </div>
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
              <span>Không tải được chi tiết mẫu quy trình này.</span>
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50/40 dark:bg-indigo-950/10">
              <LayoutTemplate className="h-10 w-10 text-indigo-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
              Chi tiết Mẫu quy trình
            </h2>
            <p className="max-w-sm text-sm text-slate-400 dark:text-slate-500">
              Chọn một mẫu quy trình phỏng vấn ở danh sách bên trái để xem nội dung cấu hình chi
              tiết của mẫu đó.
            </p>
          </div>
        )}
      </main>

      {/* 3. PREMIUM CANVAS DRAG AND DROP EDITOR DIALOG */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[95vh] max-h-[95vh] w-[98vw] max-w-[98vw] flex-row gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
          {/* 3.1 Toolbox Sidebar (Left) */}
          <div className="flex h-full w-[28%] max-w-[340px] min-w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
            <div className="flex h-[72px] shrink-0 flex-col justify-center border-b border-slate-200 bg-slate-100/30 px-5 dark:border-slate-800 dark:bg-slate-900/20">
              <h3 className="text-slate-750 text-xs font-bold tracking-wider uppercase dark:text-slate-400">
                Mẫu vòng tuyển dụng
              </h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                Kéo các mẫu này thả vào quy trình ở giữa
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
                    placeholder="Tên mẫu quy trình *"
                    className="h-9 border-slate-200 bg-slate-50 text-xs font-bold dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="max-w-[150px] flex-1">
                  <Input
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder="Danh mục *"
                    className="h-9 border-slate-200 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="hidden max-w-[300px] flex-1 sm:block">
                  <Input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Mô tả mẫu quy trình..."
                    className="h-9 border-slate-200 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Zoom controls + round count */}
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
                      Mẫu trống
                    </h4>
                    <p className="mt-1.5 max-w-[200px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                      Kéo các vòng từ cột bên trái và thả vào đây để thiết lập
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

            {/* Footer inside the editor Dialog */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <Button
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                onClick={() => setIsEditorOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="gap-2 bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700">
                <Save className="h-4 w-4" />
                {isSaving ? "Đang lưu..." : "Lưu mẫu quy trình"}
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
            className="flex max-h-[85vh] w-[1100px] max-w-[96vw] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Vòng {selectedRoundIndex + 1}: {selectedRound.name || "Chưa đặt tên"}
                  </h3>
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
                Đóng
              </Button>
            </div>

            {/* Scrollable Form Body - Side by Side layout */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
                {/* Left Column: General Configuration (col-span-5) */}
                <div className="space-y-5 lg:col-span-5">
                  <div className="border-b border-slate-100 pb-2 dark:border-slate-800/40">
                    <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      Cấu hình chung
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* Tên vòng tuyển dụng */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Tên vòng tuyển dụng
                      </Label>
                      <Input
                        value={selectedRound.name || ""}
                        onChange={(e) =>
                          updateRoundField(selectedRoundIndex, "name", e.target.value)
                        }
                        placeholder="Nhập tên vòng..."
                        className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>

                    {/* Điểm tối đa & Điểm đạt — always on the same row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Điểm tối đa (Max Score)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={selectedRound.configData?.maxScore ?? 100}
                          onChange={(e) =>
                            updateRoundConfigField(
                              selectedRoundIndex,
                              "maxScore",
                              Number(e.target.value)
                            )
                          }
                          className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Điểm đạt tối thiểu (Pass)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={selectedRound.configData?.maxScore ?? 100}
                          value={Math.round(
                            (selectedRound.passThreshold ?? 0.8) *
                              (selectedRound.configData?.maxScore ?? 100)
                          )}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const max = selectedRound.configData?.maxScore ?? 100;
                            updateRoundField(
                              selectedRoundIndex,
                              "passThreshold",
                              max > 0 ? val / max : 0.8
                            );
                          }}
                          className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Thời gian làm bài (only for rounds that need it) */}
                    {selectedRound.roundType !== "CV_SCREENING" &&
                      selectedRound.roundType !== "EMAIL_SIMULATOR" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Thời gian làm bài (Phút)
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={selectedRound.configData?.timeLimitMinutes ?? 0}
                              onChange={(e) =>
                                updateRoundConfigField(
                                  selectedRoundIndex,
                                  "timeLimitMinutes",
                                  Number(e.target.value)
                                )
                              }
                              className="w-28 border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                            <span className="text-xs text-slate-400">(0 = không giới hạn)</span>
                          </div>
                        </div>
                      )}

                    {/* Định dạng nộp hồ sơ (only if CV_SCREENING) */}
                    {selectedRound.roundType === "CV_SCREENING" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Định dạng nộp hồ sơ
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
                            <SelectItem value="pdf">Tệp PDF (.pdf)</SelectItem>
                            <SelectItem value="doc">Tệp Word (.doc, .docx)</SelectItem>
                            <SelectItem value="any">Tất cả định dạng tài liệu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Lời Hướng dẫn cho ứng viên */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-4 dark:border-slate-800/40">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Lời Hướng dẫn cho ứng viên
                    </Label>
                    <Textarea
                      value={selectedRound.configData?.instruction || ""}
                      onChange={(e) =>
                        updateRoundConfigField(selectedRoundIndex, "instruction", e.target.value)
                      }
                      placeholder={
                        selectedRound.roundType === "CV_SCREENING"
                          ? "Ví dụ: Vui lòng tải lên CV định dạng PDF của bạn để hệ thống tự động đánh giá và chấm điểm."
                          : selectedRound.roundType === "EMAIL_SIMULATOR"
                            ? "Ví dụ: Hãy đóng vai một nhân viên chăm sóc khách hàng, phản hồi lại email khiếu nại của khách hàng dưới đây. Chú ý thái độ ôn hòa, xin lỗi về sự cố và đề xuất hướng giải quyết cụ thể."
                            : "Hướng dẫn ứng viên làm bài..."
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
                      Cấu hình chi tiết
                    </h4>
                  </div>

                  {/* 1. CV_SCREENING Specific */}
                  {selectedRound.roundType === "CV_SCREENING" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Tiêu chí chấm điểm bổ sung của HR (Add-on Criteria)
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
                          placeholder="Ví dụ:&#10;- Cộng thêm 10 điểm cho ứng viên có chứng chỉ AWS/Google Cloud.&#10;- Ưu tiên các hồ sơ có bài báo khoa học (paper) đã xuất bản hoặc đạt giải thưởng học thuật.&#10;- Trừ 5 điểm nếu ứng viên không ghi rõ thời gian làm việc tại mỗi công ty."
                          rows={6}
                          className="border-slate-200 bg-white text-xs text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                        <p className="text-[10px] leading-normal text-slate-500">
                          Các tiêu chí bổ sung này sẽ được gửi kèm cùng với cấu hình gốc của hệ
                          thống để AI tự động cộng/trừ điểm theo khẩu vị tuyển dụng của bạn.
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
                          Đề bài / Tình huống giả lập Email (Scenario)
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
                          placeholder="Ví dụ:&#10;From: guest_kdz@domain.com&#10;Subject: Phàn nàn về chất lượng đơn hàng #12345&#10;&#10;Nội dung: Tôi nhận được đơn hàng trễ 2 ngày, hộp bị móp méo. Khi tôi hỏi lý do thì shipper tỏ thái độ rất cộc cằn..."
                          rows={6}
                          className="border-slate-200 bg-white text-xs text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      {/* Tiêu chí chấm điểm bổ sung của HR */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Tiêu chí chấm điểm bổ sung của HR (Add-on Criteria)
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
                          placeholder="Ví dụ:&#10;- Cộng thêm 10 điểm nếu viết thư đầy đủ lời chào mở đầu và lời chúc kết thúc lịch sự.&#10;- Trừ 5 điểm nếu viết sai chính tả quá 3 lỗi.&#10;- Ưu tiên cách giải quyết thông minh, linh hoạt."
                          rows={6}
                          className="border-slate-200 bg-white text-xs text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                        <p className="text-[10px] leading-normal text-slate-500">
                          Các tiêu chí bổ sung này sẽ được gửi kèm cùng với cấu hình gốc của hệ
                          thống để AI tự động cộng/trừ điểm theo khẩu vị tuyển dụng của bạn.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. QUIZ Specific */}
                  {selectedRound.roundType === "QUIZ" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Danh sách câu hỏi trắc nghiệm (
                          {selectedRound.configData?.quizQuestions?.length || 0})
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentQuestions = [
                              ...(selectedRound.configData?.quizQuestions || []),
                            ];
                            currentQuestions.push({
                              questionText: "Câu hỏi mới?",
                              options: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
                              correctAnswer: "Lựa chọn A",
                              points: 10,
                            });
                            updateRoundConfigField(
                              selectedRoundIndex,
                              "quizQuestions",
                              currentQuestions
                            );
                          }}
                          className="text-primary hover:text-primary/80 h-7 text-xs font-bold">
                          <PlusCircle className="mr-1 h-3.5 w-3.5" /> Thêm câu hỏi
                        </Button>
                      </div>

                      <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
                        {(selectedRound.configData?.quizQuestions || []).map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="border-slate-250 relative space-y-3 rounded-xl border bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                            <button
                              onClick={() => {
                                const currentQuestions = (
                                  selectedRound.configData?.quizQuestions || []
                                ).filter((_, idx) => idx !== qIdx);
                                updateRoundConfigField(
                                  selectedRoundIndex,
                                  "quizQuestions",
                                  currentQuestions
                                );
                              }}
                              className="absolute top-3 right-3 text-slate-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="space-y-1">
                              <span className="font-mono text-[10px] font-bold text-slate-500">
                                CÂU HỎI {qIdx + 1}
                              </span>
                              <Input
                                value={q.questionText}
                                onChange={(e) => {
                                  const currentQuestions = [
                                    ...(selectedRound.configData?.quizQuestions || []),
                                  ];
                                  currentQuestions[qIdx] = {
                                    ...currentQuestions[qIdx],
                                    questionText: e.target.value,
                                  };
                                  updateRoundConfigField(
                                    selectedRoundIndex,
                                    "quizQuestions",
                                    currentQuestions
                                  );
                                }}
                                className="border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-500">
                                CÁC PHƯƠNG ÁN LỰA CHỌN
                              </span>
                              {(q.options || []).map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5">
                                  <span className="w-4 font-mono text-[10px] font-bold text-slate-400">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const currentQuestions = [
                                        ...(selectedRound.configData?.quizQuestions || []),
                                      ];
                                      const opts = [...(currentQuestions[qIdx].options || [])];
                                      opts[oIdx] = e.target.value;
                                      currentQuestions[qIdx] = {
                                        ...currentQuestions[qIdx],
                                        options: opts,
                                      };
                                      updateRoundConfigField(
                                        selectedRoundIndex,
                                        "quizQuestions",
                                        currentQuestions
                                      );
                                    }}
                                    className="h-8 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500">
                                  ĐÁP ÁN ĐÚNG
                                </span>
                                <Select
                                  value={q.correctAnswer}
                                  onValueChange={(val) => {
                                    const currentQuestions = [
                                      ...(selectedRound.configData?.quizQuestions || []),
                                    ];
                                    currentQuestions[qIdx] = {
                                      ...currentQuestions[qIdx],
                                      correctAnswer: val,
                                    };
                                    updateRoundConfigField(
                                      selectedRoundIndex,
                                      "quizQuestions",
                                      currentQuestions
                                    );
                                  }}>
                                  <SelectTrigger className="h-8 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                    {(q.options || []).map((opt, oIdx) => (
                                      <SelectItem key={oIdx} value={opt}>
                                        {String.fromCharCode(65 + oIdx)}. {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500">
                                  ĐIỂM CÂU HỎI
                                </span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={q.points}
                                  onChange={(e) => {
                                    const currentQuestions = [
                                      ...(selectedRound.configData?.quizQuestions || []),
                                    ];
                                    currentQuestions[qIdx] = {
                                      ...currentQuestions[qIdx],
                                      points: Number(e.target.value),
                                    };
                                    updateRoundConfigField(
                                      selectedRoundIndex,
                                      "quizQuestions",
                                      currentQuestions
                                    );
                                  }}
                                  className="h-8 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!selectedRound.configData?.quizQuestions ||
                          selectedRound.configData.quizQuestions.length === 0) && (
                          <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
                            Chưa có câu hỏi trắc nghiệm nào.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. CODING Specific */}
                  {selectedRound.roundType === "CODING" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Mã danh sách bài tập (Coding Problem IDs)
                      </Label>
                      <Input
                        value={(selectedRound.configData?.codingProblemsId || []).join(", ")}
                        onChange={(e) => {
                          const idsStr = e.target.value;
                          const parsedIds = idsStr
                            .split(",")
                            .map((id) => id.trim())
                            .filter((id) => id !== "" && !isNaN(Number(id)))
                            .map(Number);
                          updateRoundConfigField(selectedRoundIndex, "codingProblemsId", parsedIds);
                        }}
                        placeholder="Nhập danh sách ID, phân tách bằng dấu phẩy (,)"
                        className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                      <p className="text-slate-550 text-[10px] leading-normal">
                        Ví dụ: 101, 102, 105 (các mã bài tập từ cơ sở dữ liệu hệ thống).
                      </p>
                    </div>
                  )}

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
                          placeholder="Cung cấp prompt cấu hình vai trò AI..."
                          rows={5}
                          className="border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <div className="mt-4 space-y-1.5">
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
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isEditorOpen && (
              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                  onClick={() => {
                    setConfigModalOpen(false);
                    setSelectedRoundIndex(null);
                  }}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  className="bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700">
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
