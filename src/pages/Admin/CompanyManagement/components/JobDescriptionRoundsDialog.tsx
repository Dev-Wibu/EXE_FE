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
import { cn } from "@/lib/utils";
import { jobDescriptionManager } from "@/services/job-description.manager";
import { roundManager } from "@/services/round.manager";
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
  Minus,
  PlusCircle,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  UserCheck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
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
}

interface UIRound {
  id?: number;
  name?: string;
  roundOrder?: number;
  roundType?: RoundType;
  passThreshold?: number;
  configData?: UIRoundConfig;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface JobDescriptionRoundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

export function JobDescriptionRoundsDialog({
  isOpen,
  onOpenChange,
  jobDescription,
  onSaved,
}: JobDescriptionRoundsDialogProps) {
  const [rounds, setRounds] = useState<UIRound[]>([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingRounds, setHasExistingRounds] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<RoundType[]>([]);

  // Drag and drop states
  const [activeDragType, setActiveDragType] = useState<RoundType | null>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  // Index of the arrow gap being hovered during drag (-1 = before first, 0 = after index 0, etc.)
  const [dragOverGap, setDragOverGap] = useState<number | null>(null);

  // Zoom level for pipeline canvas
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const COLS = 3; // cards per row

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.0, parseFloat((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.4, parseFloat((z - 0.15).toFixed(2))));
  const handleZoomReset = () => setZoomLevel(1.0);

  const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    }
  };

  // Load detailed JD information (including all rounds) and available round types
  useEffect(() => {
    if (isOpen && jobDescription?.id) {
      setIsLoading(true);
      setSelectedRoundIndex(null);

      const fetchJd = jobDescriptionManager.getById(jobDescription.id);
      const fetchTypes = roundManager.getAvailableRoundTypes();

      Promise.all([fetchJd, fetchTypes])
        .then(([jdRes, typesRes]) => {
          if (typesRes.success && typesRes.data) {
            setAvailableTypes(typesRes.data);
          } else {
            // Fallback to all if API fails
            setAvailableTypes(AVAILABLE_ROUNDS_TEMPLATES.map((t) => t.type));
          }

          if (jdRes.success && jdRes.data) {
            const fetchedRounds = jdRes.data.rounds ?? [];
            // Sort by order
            const sortedRounds = [...fetchedRounds].sort(
              (a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0)
            );
            const uiRounds: UIRound[] = sortedRounds.map((r) => ({
              ...r,
              roundType: r.roundType as RoundType,
              configData: {
                ...r.configData,
                codingProblemsId:
                  r.configData?.codingProblems
                    ?.map((cp) => cp.problemId)
                    .filter((id): id is number => id !== undefined) ?? [],
              },
            }));
            setRounds(uiRounds);
            setHasExistingRounds(fetchedRounds.length > 0);
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

  // Handle drop from toolbox
  const handleDropFromToolbox = (type: RoundType, targetIndex: number) => {
    const template = AVAILABLE_ROUNDS_TEMPLATES.find((t) => t.type === type);
    if (!template) return;

    const newRound: UIRound = {
      name: template.title,
      roundType: type,
      passThreshold: 0.8, // Default 80%
      configData: JSON.parse(JSON.stringify(template.defaultConfig)),
    };

    const updated = [...rounds];
    updated.splice(targetIndex, 0, newRound);

    // Re-assign order
    const reordered = updated.map((r, idx) => ({
      ...r,
      roundOrder: idx + 1,
    }));

    setRounds(reordered);
    setSelectedRoundIndex(targetIndex);
    toast.success(`Đã thêm vòng ${template.title}`);
  };

  // Handle reordering drop
  const handleReorder = (dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return;

    const updated = [...rounds];
    const [draggedItem] = updated.splice(dragIndex, 1);

    // Adjust drop index if it shifted after splice
    let targetIndex = dropIndex;
    if (dragIndex < dropIndex) {
      targetIndex = dropIndex - 1;
    }

    updated.splice(targetIndex, 0, draggedItem);

    // Re-assign order
    const reordered = updated.map((r, idx) => ({
      ...r,
      roundOrder: idx + 1,
    }));

    setRounds(reordered);
    setSelectedRoundIndex(targetIndex);
  };

  const handleRemoveRound = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rounds
      .filter((_, idx) => idx !== index)
      .map((r, idx) => ({
        ...r,
        roundOrder: idx + 1,
      }));
    setRounds(updated);
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
  const handleSave = async () => {
    if (!jobDescription?.id) return;
    setIsSaving(true);

    try {
      // Validate rounds
      if (rounds.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 vòng phỏng vấn.");
        setIsSaving(false);
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
        setIsSaving(false);
        return;
      }

      const payload = {
        // Map UI format to Dto expected by Backend API
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
            codingProblemsId: r.configData?.codingProblemsId || [],
          },
        })),
      };

      let response;
      if (hasExistingRounds) {
        response = await roundManager.updateForJd(jobDescription.id, payload);
      } else {
        response = await roundManager.setUpForJd(jobDescription.id, payload);
      }

      if (response.success) {
        toast.success("Đã lưu thiết lập quy trình phỏng vấn thành công!");
        onSaved?.();
        onOpenChange(false);
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-[98vw] max-w-[98vw] flex-row gap-0 overflow-hidden border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <span>Đang tải thông tin cấu hình...</span>
          </div>
        ) : (
          <>
            {/* 1. LEFT SIDEBAR: Available Rounds Toolbox (occupies full height) */}
            <div className="flex h-full w-[28%] max-w-[340px] min-w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
              <div className="flex h-[72px] shrink-0 flex-col justify-center border-b border-slate-200 bg-slate-100/30 px-5 dark:border-slate-800 dark:bg-slate-900/20">
                <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-400">
                  Mẫu vòng tuyển dụng
                </h3>
                <p className="dark:text-slate-550 mt-1 text-[11px] text-slate-500">
                  Kéo các mẫu này thả vào quy trình ở giữa
                </p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
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
              </div>
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
                    Kéo thả các vòng phỏng vấn từ danh sách bên trái để tạo pipeline cho JD:{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {jobDescription?.title}
                    </span>
                  </p>
                </div>
              </div>

              {/* Workspace: Canvas + Right Panel */}
              <div className="flex min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
                {/* 2. CENTER PANEL: Pipeline Workflow Canvas */}
                <div
                  className="relative flex flex-1 flex-col overflow-hidden bg-slate-100 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:18px_18px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"
                  onWheel={handleCanvasWheel}>
                  {/* Top bar: round count + zoom controls */}
                  <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase shadow dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
                      {rounds.length} vòng
                    </span>
                    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-1.5 py-1 shadow dark:border-slate-700 dark:bg-slate-800/90">
                      <button
                        onClick={handleZoomOut}
                        title="Thu nhỏ (Ctrl+Scroll)"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[38px] text-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={handleZoomIn}
                        title="Phóng to (Ctrl+Scroll)"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleZoomReset}
                        title="Đặt lại zoom"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white">
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable canvas area */}
                  <div className="h-full w-full overflow-auto select-none">
                    {/* Zoom wrapper */}
                    <div
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "top left",
                        width: `${100 / zoomLevel}%`,
                        minHeight: `${100 / zoomLevel}%`,
                        paddingBottom: "60px",
                      }}>
                      {rounds.length === 0 ? (
                        /* Empty state drop zone */
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverGap(0);
                          }}
                          onDragLeave={() => setDragOverGap(null)}
                          onDrop={() => {
                            setDragOverGap(null);
                            if (activeDragType) handleDropFromToolbox(activeDragType, 0);
                          }}
                          className={cn(
                            "mx-auto mt-24 flex h-52 w-96 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300",
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
                      ) : (
                        /* Grid pipeline layout */
                        <div className="p-8">
                          {/* Build rows of COLS cards each */}
                          {Array.from({ length: Math.ceil(rounds.length / COLS) }, (_, rowIdx) => {
                            const rowStart = rowIdx * COLS;
                            const rowItems = rounds.slice(rowStart, rowStart + COLS);
                            const isEvenRow = rowIdx % 2 === 0; // flow direction: even = L→R, odd = R→L
                            const displayItems = isEvenRow ? rowItems : [...rowItems].reverse();
                            return (
                              <div key={rowIdx}>
                                {/* Row of cards with arrow connectors */}
                                <div className="flex items-center">
                                  {displayItems.map((round, colIdx) => {
                                    // real index in rounds array
                                    const realIdx = isEvenRow
                                      ? rowStart + colIdx
                                      : rowStart + rowItems.length - 1 - colIdx;

                                    const template = AVAILABLE_ROUNDS_TEMPLATES.find(
                                      (t) => t.type === round.roundType
                                    );
                                    const isSelected = selectedRoundIndex === realIdx;
                                    // gap index = position where drop inserts (before this card)
                                    const gapIdx = isEvenRow
                                      ? rowStart + colIdx
                                      : rowStart + rowItems.length - colIdx;

                                    return (
                                      <div key={realIdx} className="flex items-center">
                                        {/* Arrow drop-zone connector (before each card except the first of the whole pipeline) */}
                                        {(realIdx > 0 || colIdx > 0) && (
                                          <div
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              setDragOverGap(gapIdx);
                                            }}
                                            onDragLeave={() => setDragOverGap(null)}
                                            onDrop={() => {
                                              setDragOverGap(null);
                                              if (activeDragType)
                                                handleDropFromToolbox(activeDragType, gapIdx);
                                              else if (activeDragIndex !== null)
                                                handleReorder(activeDragIndex, gapIdx);
                                            }}
                                            className={cn(
                                              "group relative mx-1 flex h-16 items-center justify-center transition-all duration-200",
                                              dragOverGap === gapIdx ? "w-20" : "w-10"
                                            )}>
                                            {dragOverGap === gapIdx ? (
                                              /* Highlighted drop zone */
                                              <div className="flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 text-blue-500 dark:border-blue-500 dark:bg-blue-950/40">
                                                <Minus className="h-3.5 w-3.5" />
                                              </div>
                                            ) : (
                                              /* Arrow connector SVG */
                                              <svg
                                                width="40"
                                                height="24"
                                                viewBox="0 0 40 24"
                                                fill="none"
                                                className="overflow-visible">
                                                <defs>
                                                  <marker
                                                    id={`arrow-${rowIdx}-${colIdx}`}
                                                    markerWidth="6"
                                                    markerHeight="6"
                                                    refX="5"
                                                    refY="3"
                                                    orient="auto">
                                                    <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                                                  </marker>
                                                </defs>
                                                <line
                                                  x1="2"
                                                  y1="12"
                                                  x2="34"
                                                  y2="12"
                                                  stroke="#94a3b8"
                                                  strokeWidth="1.5"
                                                  strokeDasharray="4 3"
                                                  markerEnd={`url(#arrow-${rowIdx}-${colIdx})`}
                                                />
                                              </svg>
                                            )}
                                          </div>
                                        )}

                                        {/* Round Card */}
                                        <div
                                          draggable
                                          onDragStart={() => setActiveDragIndex(realIdx)}
                                          onDragEnd={() => {
                                            setActiveDragIndex(null);
                                            setDragOverGap(null);
                                          }}
                                          onClick={() => setSelectedRoundIndex(realIdx)}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            if (
                                              activeDragIndex !== null &&
                                              activeDragIndex !== realIdx
                                            ) {
                                              setDragOverGap(-realIdx - 100); // unique marker for card-over-card
                                            }
                                          }}
                                          onDrop={(e) => {
                                            e.stopPropagation();
                                            setDragOverGap(null);
                                            if (activeDragType)
                                              handleDropFromToolbox(activeDragType, realIdx);
                                            else if (activeDragIndex !== null)
                                              handleReorder(activeDragIndex, realIdx);
                                          }}
                                          className={cn(
                                            "group relative w-52 shrink-0 cursor-grab rounded-2xl border bg-white p-4 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:cursor-grabbing dark:bg-slate-900/80 dark:shadow-lg",
                                            isSelected
                                              ? "scale-[1.03] border-blue-400 ring-2 ring-blue-400/30 dark:border-blue-500"
                                              : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600",
                                            activeDragIndex !== null &&
                                              activeDragIndex !== realIdx &&
                                              dragOverGap === -realIdx - 100
                                              ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/20"
                                              : ""
                                          )}>
                                          {/* Step number bubble */}
                                          <div className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                            {realIdx + 1}
                                          </div>

                                          {/* Delete button */}
                                          <button
                                            onClick={(e) => handleRemoveRound(realIdx, e)}
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
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Row-break connector: curved arrow from last card of this row to first of next */}
                                {rowIdx < Math.ceil(rounds.length / COLS) - 1 && (
                                  <div className="my-1 flex items-center justify-end pr-2">
                                    <svg width="60" height="48" viewBox="0 0 60 48" fill="none">
                                      <defs>
                                        <marker
                                          id={`bend-arrow-${rowIdx}`}
                                          markerWidth="6"
                                          markerHeight="6"
                                          refX="5"
                                          refY="3"
                                          orient="auto">
                                          <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                                        </marker>
                                      </defs>
                                      {/* L-shaped connector: right side going down then left to next row start */}
                                      <path
                                        d={
                                          isEvenRow
                                            ? "M 8 4 Q 52 4 52 24 Q 52 44 8 44"
                                            : "M 52 4 Q 8 4 8 24 Q 8 44 52 44"
                                        }
                                        stroke="#94a3b8"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 3"
                                        fill="none"
                                        markerEnd={`url(#bend-arrow-${rowIdx})`}
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. RIGHT PANEL: Configuration Sidebar (32% width) */}
                {selectedRoundIndex !== null && selectedRound && (
                  <div className="animate-in slide-in-from-right flex w-[32%] min-w-[340px] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white duration-250 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2">
                        <Settings className="text-primary h-4 w-4" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Cấu hình: Vòng {selectedRoundIndex + 1}
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        onClick={() => setSelectedRoundIndex(null)}>
                        Đóng
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 p-5">
                      <div className="space-y-5 pb-6">
                        {/* General Settings */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-300">
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

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Ngưỡng điểm đạt (Pass Threshold)
                            </Label>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.05}
                                value={selectedRound.passThreshold ?? 0.8}
                                onChange={(e) =>
                                  updateRoundField(
                                    selectedRoundIndex,
                                    "passThreshold",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                              />
                              <span className="text-xs text-slate-400">
                                (Tương đương:{" "}
                                {Math.round((selectedRound.passThreshold ?? 0.8) * 100)}% số điểm
                                tối đa)
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Thời gian làm bài (Phút)
                            </Label>
                            <div className="flex items-center gap-3">
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
                                className="w-24 border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                              />
                              <span className="text-xs text-slate-400">
                                (0 = không giới hạn thời gian)
                              </span>
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
                                    <SelectItem value="any">Tất cả định dạng tài liệu</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          {/* 2. QUIZ (quizQuestions Array builder) */}
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
                                      options: [
                                        "Lựa chọn A",
                                        "Lựa chọn B",
                                        "Lựa chọn C",
                                        "Lựa chọn D",
                                      ],
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

                              <div className="max-h-[40vh] space-y-4 overflow-y-auto pr-1">
                                {(selectedRound.configData?.quizQuestions || []).map((q, qIdx) => (
                                  <div
                                    key={qIdx}
                                    className="relative space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
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
                                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400">
                                      <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-slate-500">
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
                                        className="dark:border-slate-850 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white"
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
                                              const opts = [
                                                ...(currentQuestions[qIdx].options || []),
                                              ];
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
                                            className="dark:border-slate-850 h-8 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white"
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
                                          <SelectTrigger className="dark:border-slate-850 h-8 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white">
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
                                          className="dark:border-slate-850 h-8 border-slate-200 bg-white text-xs text-slate-900 dark:bg-slate-950 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {(!selectedRound.configData?.quizQuestions ||
                                  selectedRound.configData.quizQuestions.length === 0) && (
                                  <div className="border-slate-855 rounded-xl border border-dashed py-6 text-center text-xs text-slate-500">
                                    Chưa có câu hỏi trắc nghiệm nào.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 3. CODING (codingProblemsId Array builder) */}
                          {selectedRound.roundType === "CODING" && (
                            <>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Mã danh sách bài tập (Coding Problem IDs)
                                </Label>
                                <Input
                                  value={(selectedRound.configData?.codingProblemsId || []).join(
                                    ", "
                                  )}
                                  onChange={(e) => {
                                    const idsStr = e.target.value;
                                    const parsedIds = idsStr
                                      .split(",")
                                      .map((id) => id.trim())
                                      .filter((id) => id !== "" && !isNaN(Number(id)))
                                      .map(Number);
                                    updateRoundConfigField(
                                      selectedRoundIndex,
                                      "codingProblemsId",
                                      parsedIds
                                    );
                                  }}
                                  placeholder="Nhập danh sách ID, phân tách bằng dấu phẩy (,)"
                                  className="border-slate-200 bg-white text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                />
                                <p className="text-[10px] leading-normal text-slate-500">
                                  Ví dụ: 101, 102, 105 (các mã bài tập từ cơ sở dữ liệu hệ thống).
                                </p>
                              </div>
                            </>
                          )}

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
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Footer inside the main column */}
              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                  onClick={() => onOpenChange(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
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
    </Dialog>
  );
}
