import type { CodingProblem } from "@/services/coding-problem.manager";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen,
  Circle,
  Clock,
  Code2,
  Cpu,
  Edit2,
  Eye,
  FlaskConical,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface CodingProblemTableProps {
  problems: CodingProblem[];
  onEdit: (problem: CodingProblem) => void;
  onDelete?: (problem: CodingProblem) => void;
  onToggleStatus?: (problem: CodingProblem, isActive: boolean) => void;
}

const DIFF_CONFIG = {
  EASY: {
    label: "Easy",
    cls: "text-emerald-600 dark:text-emerald-400",
    fill: "fill-emerald-500 text-emerald-500",
  },
  MEDIUM: {
    label: "Medium",
    cls: "text-amber-600 dark:text-amber-400",
    fill: "fill-amber-500 text-amber-500",
  },
  HARD: {
    label: "Hard",
    cls: "text-rose-600 dark:text-rose-400",
    fill: "fill-rose-500 text-rose-500",
  },
} as const;

function formatDate(s?: string) {
  if (!s) return null;
  try {
    return format(new Date(s), "dd/MM/yyyy HH:mm");
  } catch {
    return null;
  }
}

function timeAgo(s?: string) {
  if (!s) return null;
  try {
    return formatDistanceToNow(new Date(s), { addSuffix: true, locale: vi });
  } catch {
    return null;
  }
}

export function CodingProblemTable({ problems, onEdit, onDelete, onToggleStatus }: CodingProblemTableProps) {
  if (problems.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-700" />
        <p className="text-sm font-medium text-slate-500">Chưa có bài tập coding nào.</p>
      </div>
    );
  }

  // Column definitions (9 columns)
  // [ID, Title, Difficulty, Config, Score, Status, Created, Updated, Actions]
  const GRID_COLS = "grid-cols-[60px_minmax(0,2fr)_110px_minmax(180px,1fr)_90px_90px_130px_130px_80px]";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
      {/* Table header */}
      <div className={`grid ${GRID_COLS} items-center border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50`}>
        {["ID", "Bài tập", "Độ khó", "Cấu hình", "Điểm", "Bật/Tắt", "Ngày tạo", "Cập nhật", ""].map((h, i) => (
          <div key={i} className={`text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 
            ${i === 4 ? "text-center" : ""} 
            ${i === 5 ? "text-center" : ""} 
            ${i === 8 ? "text-right" : ""}`}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {problems.map((p) => {
          const diff = DIFF_CONFIG[p.difficulty] ?? DIFF_CONFIG.MEDIUM;
          const totalPoints = p.hiddenTestCases?.reduce((s, tc) => s + (tc.weightPoints || 0), 0) ?? 0;
          const langs = p.codeStubs ? Object.keys(p.codeStubs) : [];
          const isActive = !p.isDeleted;

          return (
            <div
              key={p.id}
              className={`group grid ${GRID_COLS} items-center px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                !isActive ? "opacity-60 grayscale-[30%]" : ""
              }`}>
              {/* ID */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">#{p.id}</span>
              </div>

              {/* Title + metadata */}
              <div className="min-w-0 pr-6">
                <p className="truncate text-[14px] font-semibold text-slate-900 dark:text-slate-100" title={p.title}>
                  {p.title}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {/* Param types */}
                  {p.paramTypes && p.paramTypes.length > 0 && (
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Code2 className="h-3.5 w-3.5" />
                      {p.paramTypes.slice(0, 2).join(", ")}
                      {p.paramTypes.length > 2 && "..."}
                      {p.returnType && <span className="text-slate-400"> → {p.returnType}</span>}
                    </span>
                  )}
                  {/* Languages */}
                  {langs.length > 0 && (
                    <div className="flex items-center gap-1">
                      {langs.slice(0, 3).map((l) => (
                        <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {l}
                        </span>
                      ))}
                      {langs.length > 3 && (
                        <span className="text-[11px] text-slate-400">+{langs.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Difficulty */}
              <div className="pr-4">
                <div className={`flex items-center gap-1.5 text-[13px] font-bold ${diff.cls}`}>
                  <Circle className={`h-2.5 w-2.5 ${diff.fill}`} />
                  {diff.label}
                </div>
              </div>

              {/* Config (Tests + Limits) */}
              <div className="space-y-2 pr-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>{p.hiddenTestCases?.length ?? 0} ẩn</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{p.visibleExamples?.length ?? 0} mẫu</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{p.executionTimeLimitMs ?? 2000}ms</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <Cpu className="h-3 w-3" />
                    <span>{p.memoryLimitMb ?? 256}M</span>
                  </div>
                </div>
              </div>

              {/* Score Column */}
              <div className="flex justify-center pr-2">
                <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-50 px-2.5 py-1.5 min-w-[56px] border border-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <span className="font-mono text-[15px] font-bold leading-none text-emerald-600 dark:text-emerald-400">
                    {totalPoints}
                  </span>
                  <span className="mt-1 text-[9px] font-bold tracking-widest text-emerald-700/60 uppercase dark:text-emerald-400/60">
                    PTS
                  </span>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex justify-center pr-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={(val) => onToggleStatus?.(p, val)}
                  className="data-[state=checked]:bg-emerald-500 shadow-sm"
                />
              </div>

              {/* Created At */}
              <div className="flex items-center pr-2">
                {p.createdAt ? (
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {formatDate(p.createdAt)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">—</p>
                )}
              </div>

              {/* Updated At */}
              <div className="flex items-center pr-2">
                {p.updatedAt ? (
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {formatDate(p.updatedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">—</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(p)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-400">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/40 dark:hover:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/30">
        <p className="text-[11px] text-slate-500">
          <strong className="text-slate-700 dark:text-slate-300">{problems.length}</strong> bài tập
          {" · "}
          <strong className="text-emerald-600 dark:text-emerald-400">
            {problems.filter((p) => !p.isDeleted).length}
          </strong>{" "}
          đang hoạt động
          {problems.some((p) => p.isDeleted) && (
            <>
              {" · "}
              <strong className="text-slate-400">{problems.filter((p) => p.isDeleted).length} đã tắt</strong>
            </>
          )}
        </p>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <RefreshCw className="h-3 w-3" />
          Cập nhật tự động khi lưu
        </div>
      </div>
    </div>
  );
}
